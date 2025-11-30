---
title: "Nimm Game Problem"
description: "Nimm is a simple turn-based game where players take turns removing 1 or 2 stones from a shared pile, and the player who takes the last stone loses. In this version, the task is to simulate a single-player version where a loop repeatedly asks the user how many stones to take, updates the total, and ends when no stones remain. \n\n This problem is designed to teach basic control flow concepts — especially loops, conditionals, and user input."
difficulty: "Hard"
tags:
  - python
  - control flow
  - conditionals
  - user input
author: "Lucas"
created_at: "2025-06-24"
update_log:
  - date: "2025-06-24"
    author: "Lucas"
    description: "Initial creation of the problem template."
---

# Problem Statement
## Description
**Nimm** is an ancient game of strategy that is named after the old German word for "take". It is also called *Tiouk Tiouk* in West Africa and *Tsynshidzi* in China. Players alternate taking stones until there are zero left. The game of Nimm goes as follows:

1. The game starts with a pile of 20 stones between the players
2. The two players alternate turns
3. On a given turn, a player may take either 1 or 2 stones from the center pile
4. The two players continue until the center pile has run out of stones.
5. The last player to take a stone loses.

**We have broken the problem down into three smaller milestones so you can build the solution step by step.** 

## Task

**Milestone 1**

You’ll write a `loop` to remove stones from a pile.

1. **Start with 20 stones.**

**Milestone 2**
2. **Repeat this process until there are zero stones left:**
  - Print how many stones are left.  
    _Example:_ `There are 20 stones left`
  - Ask the user how many stones to remove using this code:  
    ```python
    int(input("Would you like to remove 1 or 2 stones?"))
    ```
  - Subtract that number of stones from the total.

  **Important:**  
  - For now, don’t worry about whose turn it is.  
  - Don’t worry about making sure the user enters only 1 or 2 stones. any number is fine in this step.

**Milestone 3**
1. **End the game when there are no stones left.**  
  _Print:_ `Game over`

## Example output: 
```
There are 20 stones left
Would you like to remove 1 or 2 stones? 2

There are 18 stones left
Would you like to remove 1 or 2 stones? 17

There are 1 stones left
Would you like to remove 1 or 2 stones? 3

Game over
```

## Evaluation
```python
# Test cases for the Nimm game
# Each test case is a list of inputs (numbers of stones to remove)
# The inputs will be provided sequentially to the input() function

test_cases = [
    # Test case 1: Remove 2 stones each time (10 times = 20 stones)
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    
    # Test case 2: Remove 1 stone each time (20 times = 20 stones)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    
    # Test case 3: Mixed inputs (alternating 1 and 2)
    [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1],
    
    # Test case 4: Remove 2 stones most of the time, then 1 at the end
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1],
    
    # Test case 5: Remove 1 stone most of the time, then 2 at the end
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]
]
```

## Lesson Goals

- initialize and update a state variable (stone count),
- use a while loop with a clear termination condition, 
- read and convert user input with input() and int(), 
- perform arithmetic updates to mutate program state, 
- print state each iteration for user feedback, 
- trigger a post-loop action when the end condition is met ('Game over'), 
- practice reasoning about loop invariants and preventing infinite loops

## Common Mistakes

- forgetting to initialize the stone count variable, 
- using assignment (=) instead of comparison (==) in loop condition, 
- loop condition written incorrectly (e.g., while stones > 0 vs while stones >= 0), 
- not updating the stone count inside the loop, 
- subtracting stones before checking input validity, 
- input not converted to int (leads to string concatenation instead of arithmetic), 
- using input() without casting and trying to subtract a string from an integer, 
- placing print statements outside of the loop so they only run once, 
- off-by-one error in ending condition (ending too early or too late), 
- forgetting to decrement the pile when stones = 1 or 2, 
- not handling negative stone counts if user enters a big number, 
- infinite loop caused by never reaching zero, 
- forgetting to break out of the loop when stones = 0, 
- bad indentation causing code not to run inside the loop, 
- using == instead of > or >= in loop condition, causing game to skip iterations, 
- forgetting parentheses in print(), e.g., print ‘Game over’, 
- using == for assignment in Python (syntax error), 
- forgetting to add spacing print() leading to unreadable output, 
- not resetting or reusing variable names consistently, 
- ignoring edge cases like removing 0 stones or too many stones

## Suggested Answer
```python
# Start with 20 stones
stones = 20

# Repeat until there are zero stones left
while stones > 0:
    print(f"There are {stones} stones left")
    remove = int(input("Would you like to remove 1 or 2 stones? "))
    stones -= remove
    print()

# End of the game
print("Game over")
```

---
# Interface

## User Input
```python
# Start your code here :D

```

## Agent Input
```python
# Start with 20 stones
stones == 20

```