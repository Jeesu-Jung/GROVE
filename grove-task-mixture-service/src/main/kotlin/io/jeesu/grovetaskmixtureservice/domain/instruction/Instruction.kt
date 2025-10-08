package io.jeesu.grovetaskmixtureservice.domain.instruction

data class Instruction(
    val id: Long,
    val vector: List<Float>,
    val input: String,
    val inputs: String,
    val constraint: String,
    val output: String,
    val instruction: String
)

interface InstructionRepository {
    fun searchByVector(vector: List<Float>, size: Int): List<Instruction>
}
