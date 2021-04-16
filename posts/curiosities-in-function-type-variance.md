---
title: Curiosities in Function Type Variance
author: Prescott
date: "2021-04-15"
tags:
  - functional-programming
  - java
  - scala
  - typescript
---

# Into the `void`

Motivated by a keen appreciation of strong-typing developed while working with Scala and the opportunity to write Typescript at Fitbit, I've been brushing up on the latter. While investigating some of TS's more niche types like `never` and `void`, I came across some interesting behavior of higher-order functions (functions that take a function as an argument, or return a function).

It's useful to know that `void` in Typescript is the **absence of having any type at all**. [typescriptlang.org](https://www.typescriptlang.org/docs/handbook/basic-types.html#void)

First, let's define a simple function that takes one parameter, a function of `number => string`, and calls it with the number five. We can define this as a literal function declaration or an anonymous function expression.

```tsx
function callFive1(f: (n: number) => string) {
    return f(5);
}

const callFive2 = (f: (n: number) => string) => {
    return f(5);
};
```

Both of these are valid declarations (TS infers the return type).

Unsurprisingly, if we were to incorrectly annotate the return types as, say `number`, the compiler will rightfully complain in both cases.

```tsx
// Type 'string' is not assignable to type 'number'.
function callFive(f: (n: number) => string): number {
    return f(5); 
}

// Type '(f: (n: number) => string) => string' is not assignable to type '(f: (n: number) => string) => number'.
//   Type 'string' is not assignable to type 'number'.
const callFive: (f: (n: number) => string) => number = (f) => {
    return f(5);
};
```

We're not returning a `number` in either case, so TypeScript is understandably not happy.

Note for the anonymous case the error emanates from inability to assign the anonymous *function* to the defined *function type* (as a result of its return type).

Where things get a bit puzzling is if instead we annotate the return types as `void`. Now, *only the literal function declaration fails to compile*.

```tsx
// Type 'string' is not assignable to type 'void'.
function callFive(f: (n: number) => string): void {
    return f(5);
}

let callFive: (f: (n: number) => string) => void;

// No problems here, even though this clearly doesn't return void.
callFive = (f) => {
    return f(5);
};
```

See all the examples at [TypeScript Playground](https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBAhgGzQMRgNwKYCMAFMAFyJFjlggC2ARngE4CUiAvAHyIDOUTMMAHM2AbwBQiKYiZ4oIJkmBEArCwDc4gL7jxEBH2TosuPACYOFMhSqIaDZmy69+gkR24TpMuQqWqNbU1xUEhYBCMMbHwAZhJySmo6RlYPFwFhFiSHJkQvaVl5RURlNU0dPQMoSJN8ABYE60S7ZMc0vgz3Z3sUyxInT0kC32LSwK1g0Oh4JFQo0xV4m2yUgfS3LMQcOBgAEzyhqUK-EoDy3TQ5Gui8ADZGhNsetucOjbTtvc052ru+4DW+SOI38ZSCQA)

I've broken the typing and the assignment of the anonymous case up for clarity; the result is the same with inline types.

## 🧑‍🚒TypeScript? More Like TrashScript!?

At first blush, this might seem like a deficiency in the language or the compiler: the last example defines `callFive` as something that takes a function of `number => string` and returns `void`, but then its implementation returns a string. What gives!?

The simplest answer is buried a bit in the [TypeScript Docs](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void), which even admit "the `void` return type for functions can produce some unusual, but expected behavior." In short:

> Contextual typing with a return type of `void` does **not** force functions to **not** return something.

This explains the last case: when we specify a `void` return type inline, we're effectively advertising we don't care about the return value, and therefore *any* return type is valid. A great example of this is function that takes a callback, calls it with something, and then does nothing with the result; the point is that the callback has some effect opaque to the function calling it.

As the docs point out, this allows easy interop with methods like `Array.forEach`: it expects a function that returns `void`, but because of the above it *can* be passed one that returns any type. Since many of the JavaScript mutators (the docs mention `Array.prototype.push`) return concrete types, this avoids having to redefine or write wrappers for them. 

But what about the error for the function declaration? Why does that make the compiler mad? Again the docs have the answer:

> There is one other special case to be aware of, when a literal function definition has a `void` return type, that function must **not** return anything.

In the literal case, we're saying, *I'm defining a function, and it returns `void`*, but since that's clearly not the case, TS will error to alert you that you've likely made a mistake either in your return type or your implementation. In fact, there's a [specific entry in the TypeScript FAQ](https://github.com/Microsoft/TypeScript/wiki/FAQ#why-are-functions-returning-non-void-assignable-to-function-returning-void) just for people like me who stumble on this. RTFM Prescott! 😊

In the other case, we're *assigning* a function of type `number => string` to a `number => void` type, and TS allows it because this is tantamount to the caller saying, *I don't care about the return type, just give me any function that takes a number.* Cool!

# Down the Rabbit Hole

(**Warning**: there is some Scala in here. It's like Java but better. Just breathe calmly and it will all be fine. We'll tie it back to Java at the end.)

The above example alone is little more than esoterica, but it can actually be understood in terms of something more meaningful: type variance. 

Let's explore this in terms of a fanciful example. Let's say I'm opening *Prescott's Awesome Fruit Breakfast Spot* and looking to hire a chef. My suppliers will give me fruit, and I'll be serving breakfast, so naturally I'll need a chef who can make breakfast from fruit. We might model chefs as functions that convert an `Ingredient` into a `Meal`, in which case the kind I'm looking for could be expressed as:

```scala
// The chefs I need are functions from Fruit => Breakfast
trait PrescottsRestaurantChef extends Function[Fruit, Breakfast]

// Let's also define our hierarchy (it's pretty straightforward)
class Ingredient
class Fruit extends Ingredient
class Watermelon extends Fruit

class Meal
class Breakfast extends Meal
class FancyBreakfast extends Breakfast
```

One option is I could find a chef that prepares exactly fruit, and makes exactly breakfast: it would fit my requirements, well, exactly! But what about a chef that only uses `Watermelon`, or produces a `Meal` instead of a `Breakfast`? Could I hire them for my restaurant?

## Input Parameter Type Variance

Let's start by considering the input to our chef functions, the ingredient. Suppose we have the following two chefs that only make breakfast. Which of them could I hire to work at my restaurant?

```scala
val masterBreakfastChef = (i: Ingredient) => new Breakfast()
val watermelonBreakfastChef = (w: Watermelon) => new Breakfast()
```

The first chef could work: she can make the `Breakfast` I need from any `Ingredient` at all, which means she can certainly make it from `Fruit`. She is able to handle a **supertype** of the parameter I'm going to "call" with.

The second chef, however, is a no-go. I'm looking for a chef to make breakfast from *any* fruit, but he couldn't prep an apple, or a grapefruit, or anything except a `Watermelon`! This chef only knows how to deal with a **subtype** of my parameter type. The compiler will verify this for us if we try to define these chefs as `PrescottRestaurantChef`s:

```scala
val masterBreakfastChef: PrescottsRestaurantChef = (i: Ingredient) => new Breakfast()
// masterBreakfastChef: PrescottsRestaurantChef = <function1>

val watermelonBreakfastChef: PrescottsRestaurantChef = (w: Watermelon) => new Breakfast()
// error: type mismatch;
//  found   : Watermelon => Breakfast
//  required: PrescottsRestaurantChef
```

## Return Type Variance

What about our return types: the `Meal`s the chefs make? Let's now consider two chefs that specialize in `Fruit`, but make different meals from them:

```scala
val fancyBreakfastChef = (f: Fruit) => new FancyBreakfast()
val mealChef = (f: Fruit) => new Meal()
```

Since I'm only serving `Breakfast`, I'd be fine hiring `fancyBreakfastChef`, because all the meals she cooks will be breakfasts.

The `mealChef`, however, might decide to make lunch, or dinner or just a generic `Meal`, so I can't guarantee I could serve all his creations at my breakfast-only spot. This is in fact the exact opposite case of the parameter type pattern: I need a chef that produces my desired return type **or a subtype**. Again the compiler will tell us this:

```scala
val fancyBreakfastChef: PrescottsRestaurantChef = (f: Fruit) => new FancyBreakfast()
// fancyBreakfastChef: PrescottsRestaurantChef = <function1>

val mealChef: PrescottsRestaurantChef = (f: Fruit) => new Meal()
// error: type mismatch;
//  found   : Meal
//  required: Breakfast
```

## Covariance and Contravariance

What we've just described above is that a function can be considered a subtype of another function—and therefore be used in place of it—if both of the following hold:

- Its arguments are the same types or supertypes. Since a **supertype** argument leads to a **subtype** function, the type of the parameter(s) are said to be *contravariant.*
- Its return type is the same type or a subtype. Since a **subtype** return type leads to a **subtype** function, the return type is said to be *covariant.*

The easiest way to think about this is: 

- You need a function that can handle your input or something more general (if it can handle any fruit it can handle watermelon)
- And return the type you expect or something more specific (if you need to serve breakfast you can serve a fancy breakfast, or a quick breakfast, or a cheap breakfast).

Naturally, both of these can occur at once, so I'd be perfectly happy hiring a chef of type `Ingredient => FancyBreakfast`, for example.

## ❓️Super Fun Question

### What are the three possible subtypes of `Fruit => Fruit` ?

1. `Ingredient => Fruit` more general parameter (contravariance)
2. `Fruit => Watermelon` more specific return type (covariance)
3. `Ingredient => Watermelon` both

## Type Parameters

This is [built into Scala](https://www.scala-lang.org/api/current/scala/Function1.html)!

```scala
trait Function1[-T1, +R] extends AnyRef
trait Function2[-T1, -T2, +R] extends AnyRef
```

Scala uses `-` and `+` to indicate contra- and covariance, so the above is just: functions are
contravariant in input types and covariant in the return type.

See [JEP 300](https://openjdk.java.net/jeps/300) for an open proposal to add this power to Java. We might be waiting for a while, so we should just switch to Scala. 🙏

Java's kludgy `FunctionalInterface`s leave a lot to be desired, but you can see the same variance at play inside some of their methods, or when we use `com.twitter.util.func` and friends to interop between Java and a better language. 😂 

Here's a Java example based on extending a function, either by chaining another one after it, with `andThen`, or before it, with `compose`. See the [Java Docs](https://docs.oracle.com/javase/8/docs/api/java/util/function/Function.html).

```java
package java.util.function

public interface Function<T, R> {
    ...
    // andThen takes this T => R and combines R => V to give us T => V.
    default <V> Function<T, V> andThen(Function<? super R, ? extends V> after)
    
    // compose takes a V => T and combines this T => R to give us V => R
    default <V> Function<V, R> compose(Function<? super V, ? extends T> before)
}
```

`andThen`

- `? super R` in the parameter position to indicate contravariance. The parameter function needs to handle an `R` or wider.
- `? extends V` to indicate covariance in the return type: the overall function will return a `V`, so the `andThen` argument needs to return that or narrower.

`compose`

- `? super V` in the parameter position to indicate contravariance. We're creating a new function that takes a `V`, so the parameter function needs to handle that or wider.
- `? extends T` to indicate covariance in the return type: this function can handle `T`, to the parameter function—which gets called first—must output `T` or narrower.

## ❓️Super Fun Question Take Two

### Write implementations for `andThen` and `compose`.

Hint: just one line! (Assume the parameter function isn't null).

```java
default <V> Function<T, V> andThen(Function<? super R, ? extends V> after) {
    return (T t) -> after.apply(apply(t));
}

default <V> Function<V, R> compose(Function<? super V, ? extends T> before) {
    return (V v) -> apply(before.apply(v));
}
```

# 🤔 Reframing TypeScript's `void` Behavior

Now that we know a little more about variance in function parameter and return types, we can understand TypeScript's decision to allow functions with any return type to be assigned to declarations that declare a `void` return on a slightly deeper level. It's not *exactly* variance at play because of the particulars of `void`, but bear with me!

Recall that our initial point of curiosity was that we can provide a function with any return type to one with return type `void`:

```tsx
function aPuppy(): string {
    return "🐶";
}

function logWatermelonAndCall(callback: () => void) {
    console.log("🍉🍉🍉🍉🍉");
    callback();
}

// No error, even though logWatermelonAndCall expects a void-returning function
// and we provided it with one that returns a string
logWatermelonAndCall(aPuppy);
```

In the context of this behavior, if we treat the `void` return as a subtype of every type, then a function with *any* return type could be substituted for our callback by covariance. The caller is ignoring the result by treating it as `void`, so it doesn't matter what we return.

Again, although Typescript's `void` is *not* strictly speaking a universal subtype, this is a useful mental model for understanding the behavior, and in fact Scala basically _does_ make it's void equivalent `Nothing` the [subtype of all types](https://docs.scala-lang.org/tour/unified-types.html#nothing-and-null). Awesome! 🤯

# Closing Thoughts

In the end, the initial behavior we observed in TypeScript is little more than a curiosity, but at its heart is something much more complex and important: the question of what functions can be legally substituted for other functions. Ultimately type systems in languages are implementations of mathematical concepts (which I mostly don't understand 😛), and can be both surprising and imperfect.

In fact, enforcing contravariance of function parameters wasn't introduced into TypeScript until version 2.6, and must be enabled by setting the `strictFunctionTypes` compiler option project's `tsconfig.json`, or the more general `strict` option, which includes it. Without it, parameters will be checked **bivariantly**, which can lead to runtime errors. See [Strict Function Types in TypeScript: Covariance, Contravariance and Bivariance for more discussion](https://codewithstyle.info/Strict-function-types-in-TypeScript-covariance-contravariance-and-bivariance/).

This post is far too long already, but note that [variance is most relevant in languages](https://stackoverflow.com/questions/9302739/why-arent-there-many-discussions-about-co-and-contra-variance-in-haskell-as-o) that blend functional and OOP paradigms because OOP notions of sub- and supertypes must be reconciled with function types.

## TL;DR

- Functions can be sub and super-types of other functions, determining when they can and cannot be substituted for each other
- Functions are contravariant in the parameter types and covariant in the return type (`[-T,+R]`!)
- These concepts are important for language design, and useful, fun and mind-expanding to think about. You might not use them tomorrow, but [then again, you might](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Collections.html#max(java.util.Collection,java.util.Comparator)), and now we understand the typing in a signature like `max(Collection<? extends T> coll, Comparator<? super T> comp)`. How cool is that!?

# 🙇 Thank you!

Thanks for checking out my Light Learning Newsletter—I really hope you enjoyed it! My goal is to publish ~1 issue per month on a variety of interesting engineering topics. While you're eagerly awaiting new content, I welcome thoughts, ideas, comments, criticism, and corrections of any kind.

