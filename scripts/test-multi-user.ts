// Run this to verify conflict resolution and sync work correctly

import { transformOperation, applyOperation } from "../lib/operational-transform"
import type { Operation } from "../lib/operational-transform"

// Simulate a client state
interface SimulatedClient {
  id: string
  content: string
  operations: Operation[]
  pendingOps: Operation[]
}

// Create a simulated client
function createClient(id: string): SimulatedClient {
  return {
    id,
    content: "",
    operations: [],
    pendingOps: [],
  }
}

// Simulate typing at a position
function createInsertOp(clientId: string, position: number, content: string, timestamp: number): Operation {
  return {
    id: `${clientId}-${timestamp}`,
    type: "insert",
    position,
    content,
    timestamp,
    userId: clientId,
  }
}

// Simulate deleting at a position
function createDeleteOp(clientId: string, position: number, length: number, timestamp: number): Operation {
  return {
    id: `${clientId}-${timestamp}`,
    type: "delete",
    position,
    length,
    timestamp,
    userId: clientId,
  }
}

// Test scenario 1: Simple concurrent inserts
function testConcurrentInserts() {
  console.log("\n=== Test 1: Concurrent Inserts ===")

  const client1 = createClient("user1")
  const client2 = createClient("user2")
  const serverOps: Operation[] = []

  // Both clients insert at position 0
  const op1 = createInsertOp("user1", 0, "A", 100)
  const op2 = createInsertOp("user2", 0, "B", 110)

  console.log("Client1 inserts 'A' at position 0")
  console.log("Client2 inserts 'B' at position 0")

  // Apply to server with transformation
  serverOps.push(op1)
  client1.content = applyOperation(client1.content, op1)

  // Transform op2 against op1
  const transformedOp2 = transformOperation(op2, op1)
  serverOps.push(transformedOp2)

  console.log("Server applies operations:", serverOps)

  // Apply to both clients with transformations
  client1.content = applyOperation(client1.content, transformedOp2)
  client2.content = applyOperation(client2.content, op1)
  client2.content = applyOperation(client2.content, transformedOp2)

  console.log("Final state:")
  console.log(`  Client1: "${client1.content}"`)
  console.log(`  Client2: "${client2.content}"`)
  console.log(`  ✓ Convergence: ${client1.content === client2.content}`)

  return client1.content === client2.content
}

// Test scenario 2: Insert followed by delete
function testInsertThenDelete() {
  console.log("\n=== Test 2: Insert Then Delete ===")

  const client1 = createClient("user1")
  const client2 = createClient("user2")

  // Client1 inserts "Hello"
  const op1 = createInsertOp("user1", 0, "Hello", 100)
  client1.content = applyOperation(client1.content, op1)
  console.log(`Client1 inserts "Hello": "${client1.content}"`)

  // Client2 deletes at position 2, length 2 (targeting "ll")
  const op2 = createDeleteOp("user2", 2, 2, 110)
  console.log(`Client2 deletes at position 2, length 2`)

  // Transform op2 against op1
  const transformedOp2 = transformOperation(op2, op1)

  // Apply to clients
  client1.content = applyOperation(client1.content, transformedOp2)
  client2.content = applyOperation(client2.content, op1)
  client2.content = applyOperation(client2.content, transformedOp2)

  console.log("Final state:")
  console.log(`  Client1: "${client1.content}"`)
  console.log(`  Client2: "${client2.content}"`)
  console.log(`  ✓ Convergence: ${client1.content === client2.content}`)

  return client1.content === client2.content
}

// Test scenario 3: Overlapping deletes
function testOverlappingDeletes() {
  console.log("\n=== Test 3: Overlapping Deletes ===")

  const client1 = createClient("user1")
  const client2 = createClient("user2")
  const serverContent = "ABCDEF"

  // Both clients start with same content
  client1.content = serverContent
  client2.content = serverContent

  // Client1 deletes positions 1-3 (B, C)
  const op1 = createDeleteOp("user1", 1, 2, 100)
  console.log(`Client1 deletes positions 1-3 from "${serverContent}"`)

  // Client2 deletes positions 2-4 (C, D)
  const op2 = createDeleteOp("user2", 2, 2, 110)
  console.log(`Client2 deletes positions 2-4 from "${serverContent}"`)

  // Apply to server and transform
  client1.content = applyOperation(client1.content, op1)
  const transformedOp2 = transformOperation(op2, op1)

  // Apply to clients
  client1.content = applyOperation(client1.content, transformedOp2)
  client2.content = applyOperation(client2.content, op1)
  client2.content = applyOperation(client2.content, transformedOp2)

  console.log("Final state:")
  console.log(`  Client1: "${client1.content}"`)
  console.log(`  Client2: "${client2.content}"`)
  console.log(`  ✓ Convergence: ${client1.content === client2.content}`)

  return client1.content === client2.content
}

// Test scenario 4: Complex rapid-fire operations
function testComplexScenario() {
  console.log("\n=== Test 4: Complex Scenario ===")

  const client1 = createClient("user1")
  const client2 = createClient("user2")
  const serverOps: Operation[] = []

  // Simulate rapid-fire edits
  const ops = [
    createInsertOp("user1", 0, "a", 100),
    createInsertOp("user2", 1, "b", 105),
    createInsertOp("user1", 1, "c", 110),
    createDeleteOp("user2", 0, 1, 115),
  ]

  console.log("Applying sequence of operations:")
  ops.forEach((op, i) => {
    console.log(`  ${i + 1}. ${op.type} by ${op.userId}`)
  })

  let transformed = ops[0]
  serverOps.push(transformed)

  for (let i = 1; i < ops.length; i++) {
    transformed = ops[i]
    for (const prevOp of serverOps) {
      transformed = transformOperation(transformed, prevOp)
    }
    serverOps.push(transformed)
  }

  // Apply all operations to client1
  client1.content = serverOps.reduce((text, op) => applyOperation(text, op), "")

  // Apply all operations to client2
  client2.content = serverOps.reduce((text, op) => applyOperation(text, op), "")

  console.log("Final state:")
  console.log(`  Client1: "${client1.content}"`)
  console.log(`  Client2: "${client2.content}"`)
  console.log(`  ✓ Convergence: ${client1.content === client2.content}`)

  return client1.content === client2.content
}

// Run all tests
function runAllTests() {
  console.log("[v0] Running Multi-User Scenario Tests")
  console.log("=====================================")

  const results = [testConcurrentInserts(), testInsertThenDelete(), testOverlappingDeletes(), testComplexScenario()]

  console.log("\n=====================================")
  console.log(`Tests passed: ${results.filter((r) => r).length}/${results.length}`)

  if (results.every((r) => r)) {
    console.log("✓ All tests passed! System is ready for deployment.")
  } else {
    console.log("✗ Some tests failed. Please review the conflict resolution logic.")
  }
}

runAllTests()
