package io.jeesu.grovetaskmixtureservice.domain.mixture

data class BestModel(
    val model: String,
    val dataSize: Int,
    val task: String,
    val programming: Int,
    val math: Int,
    val creativeWriting: Int,
    val grammar: Int,
    val history: Int
)

interface BestModelRepository {
    fun findAll(): List<BestModel>
    fun findByModelAndDataSizeAndTask(model: String, dataSize: Int, task: String): BestModel?
}
