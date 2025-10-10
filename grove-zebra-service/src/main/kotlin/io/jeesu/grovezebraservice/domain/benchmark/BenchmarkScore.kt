package io.jeesu.grovezebraservice.domain.benchmark

class BenchmarkScore(
    val model: String,
    val accuracyIFeval: Double,
    val accuracyMMLU: Double,
    val accuracyMMLUPro: Double,
    val accuracyArcEasy: Double,
    val accuracyArcChallenge: Double,
    val accuracyHellaswag: Double,
    var scoreMatrix: List<Double> = emptyList()
) {
    companion object {
        fun empty(): BenchmarkScore = BenchmarkScore("", 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    }
}

interface BenchmarkScoreRepository {
    fun findAll(): List<BenchmarkScore>
}
