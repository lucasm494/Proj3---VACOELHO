
# Use Case Description: **/animate Timelapse Block Animation Command**

## **Use Case Name:**  
Animate Timelapse Effect for Block Placement

---

## **Goal**  
The purpose of the `/animate` command is to create a visually appealing timelapse animation effect by placing blocks from a clipboard selection, one by one, in a specified region within a Minecraft world. This allows users to build structures incrementally, which can be useful for presentations, showcases, or creative in-game events.

---

## **Primary Actor**  
- **Actor:** A player or administrator with the necessary WorldEdit permissions (`worldedit.clipboard.animate`).

---

## **Preconditions**  
1. The player must have WorldEdit installed and have sufficient permissions (`worldedit.clipboard.animate`) to execute the command.
2. A region must be selected in the world that contains the blocks to be animated.
3. The player must have copied a valid structure or selection to the clipboard prior to execution.
4. The player must have access to sufficient resources or memory to handle large-scale animations.

---

## **Triggers**  
- The player or administrator executes the `/animate` command with optional parameters to customize the animation.

---

## **Main Flow**  

1. **Command Execution:**  
   The player runs the `/animate` command with the following optional arguments:  
   ```
   /animate [--a] [--o] [delay]
   ```
   - `--a`: Skip air blocks during animation.  
   - `--o`: Paste the selection at the original position instead of the player's position.  
   - `delay`: The time delay (in milliseconds) between each block placement (default: 50ms).

2. **Region Validation:**  
   The method verifies that the selected region is valid and copies it to the clipboard.

3. **Origin Determination:**  
   Depending on the `--o` flag:  
   - If `--o` is provided, the animation begins at the original coordinates of the selection.  
   - If `--o` is omitted, the animation starts at the actor’s current position.

4. **Animation Scheduling:**  
   - The blocks in the selection are iterated through one by one.
   - A scheduled executor service is used to handle the timed placement of each block, respecting the user-defined or default delay.
   - Blocks are placed sequentially at their target positions relative to the origin.

5. **Conditional Air Block Skipping:**  
   If the `--a` switch is provided, air blocks (empty space) in the clipboard selection are ignored during the animation to speed up the process and reduce unnecessary delays.

6. **Block Placement:**  
   - Each block is placed individually using the `editSession.setBlock()` method, which applies the changes to the world.
   - If a block is placed successfully, the `editSession.close()` method is called to finalize it immediately.

7. **Completion Message:**  
   After all blocks have been placed, the actor is notified with a completion message:  
   *"Animation complete in X milliseconds."*

---

## **Alternative Flow**  

- **Invalid Selection:**  
  If the region is invalid or exceeds the allowable size, the command will terminate and return an error message to the actor.

- **Premature Cancellation:**  
  If the actor cancels the command execution or shuts down the server before completion, the scheduled executor service is safely shut down to avoid resource leaks.

---

## **Postconditions**  
- The animated block placement is complete.
- The actor receives feedback that the animation was successful.
- The clipboard content remains available for further use unless explicitly cleared.

---

## **Exceptions**  
1. **WorldEditException:**  
   If any block placement fails due to an error, it will be caught, and the stack trace will be printed for debugging purposes.

2. **Executor Shutdown Exception:**  
   If the scheduled executor fails to shut down properly, a warning message is logged.

---

## **Example Command Usage**  

1. **Basic Animation with Default Delay:**  
   ```
   /animate
   ```
   (Places all blocks sequentially with a 50ms delay between each placement.)

2. **Skip Air Blocks:**  
   ```
   /animate --a
   ```
   (Skips all air blocks in the clipboard selection, placing only actual blocks.)

3. **Paste at Original Position with Custom Delay:**  
   ```
   /animate --o 100
   ```
   (Places the structure at its original position with a 100ms delay between each block.)

4. **Combination of Flags:**  
   ```
   /animate --a --o 75
   ```
   (Pastes at the original position, skipping air blocks, with a 75ms delay.)
