package io.jeesu.grovetaskmixtureservice.domain.seed

data class SeedSentence(
    val id: Long,
    val sentence: String,
    val type: String?,
    val vector: List<Float>?
)

interface SeedSentenceRepository {
    fun findAll(page: Int, size: Int): List<SeedSentence>
}
