package io.jeesu.grovezebraservice.application

import io.jeesu.grovezebraservice.application.mapper.BenchmarkMapper
import io.jeesu.grovezebraservice.domain.benchmark.BenchmarkScore
import io.jeesu.grovezebraservice.domain.benchmark.BenchmarkScoreRepository
import io.jeesu.grovezebraservice.presentation.dto.BenchmarkDto
import org.springframework.stereotype.Service
import kotlin.math.sqrt

@Service
class ModelBenchmarkService(
    private val benchmarkScoreRepository: BenchmarkScoreRepository,
    private val mapper: BenchmarkMapper
) {
    fun findAll(): List<BenchmarkScore> = benchmarkScoreRepository.findAll()

    fun findSuperiorModels(request: BenchmarkDto.BestModelRequest): Pair<String, String> {
        val modelBenchmark = loadBenchmarksWithMatrix(request)

        val ranked: List<Pair<String, Double>> = modelBenchmark
            .map { it.model to it.scoreMatrix.sum() }
            .sortedByDescending { it.second }

        val first: String = ranked.getOrNull(0)?.first ?: ""
        val second: String = ranked.getOrNull(1)?.first ?: ""
        return first to second
    }

    fun findSimilarityModels(request: BenchmarkDto.BestModelRequest): Pair<String, String> {
        val modelBenchmark = loadBenchmarksWithMatrix(request)

        if (modelBenchmark.size < 2) return (modelBenchmark.getOrNull(0)?.model ?: "") to ""

        var bestPair: Pair<BenchmarkScore, BenchmarkScore> = BenchmarkScore.empty() to BenchmarkScore.empty()
        var bestSimilarity = Double.NEGATIVE_INFINITY

        for (i in 0 until modelBenchmark.size - 1) {
            val a = modelBenchmark[i]
            for (j in i + 1 until modelBenchmark.size) {
                val b = modelBenchmark[j]
                val sim = cosineSimilarity(a.scoreMatrix, b.scoreMatrix)
                if (sim > bestSimilarity) {
                    bestSimilarity = sim
                    bestPair = a to b
                }
            }
        }

        if (bestPair.second.scoreMatrix.sum() > bestPair.first.scoreMatrix.sum()) {
            bestPair = bestPair.second to bestPair.first
        }

        return bestPair.first.model to bestPair.second.model
    }

    fun findSuperiorPlusSimilarityModels(request: BenchmarkDto.BestModelRequest): Pair<String, String> {
        val modelBenchmark = loadBenchmarksWithMatrix(request)

        if (modelBenchmark.isEmpty()) return "" to ""
        if (modelBenchmark.size == 1) return modelBenchmark.first().model to ""

        val first: BenchmarkScore = modelBenchmark.maxByOrNull { it.scoreMatrix.sum() } ?: return "" to ""
        val candidates: List<BenchmarkScore> = modelBenchmark.filter { it.model != first.model }

        var bestSecond: BenchmarkScore? = null
        var bestSimilarity = Double.NEGATIVE_INFINITY
        for (candidate in candidates) {
            val sim = cosineSimilarity(first.scoreMatrix, candidate.scoreMatrix)
            if (sim > bestSimilarity) {
                bestSimilarity = sim
                bestSecond = candidate
            }
        }

        val secondModel = bestSecond?.model ?: ""
        return first.model to secondModel
    }

    fun findSimilarModel(request: BenchmarkDto.SimilarityModelRequest): String {
        val modelBenchmark = loadBenchmarksWithMatrix(mapper.toBestModelRequest(request))

        var similarModel = ""
        var similarity = Double.NEGATIVE_INFINITY

        val model = modelBenchmark.find { it.model == request.model } ?: throw IllegalArgumentException("No model found for ${request.model}")
        val candidates: List<BenchmarkScore> = modelBenchmark.filter { it.model != request.model }

        candidates.forEach { candidate ->
            val sim = cosineSimilarity(model.scoreMatrix, candidate.scoreMatrix)
            if (sim > similarity) {
                similarity = sim
                similarModel = candidate.model
            }
        }

        return similarModel
    }

    private fun updateMatrix(benchmarkScore: BenchmarkScore, request: BenchmarkDto.BestModelRequest) {
        val matrix = mutableListOf<Double>()
        if (request.includeInstructionFollowing) {
            matrix.add(benchmarkScore.accuracyIFeval)
        }
        if (request.includeKnowledge) {
            matrix.add(benchmarkScore.accuracyMMLU)
            matrix.add(benchmarkScore.accuracyMMLUPro)
        }
        if (request.includeReasoning) {
            matrix.add(benchmarkScore.accuracyArcEasy)
            matrix.add(benchmarkScore.accuracyArcChallenge)
            matrix.add(benchmarkScore.accuracyHellaswag)
        }
        benchmarkScore.scoreMatrix = matrix
    }

    private fun loadBenchmarksWithMatrix(request: BenchmarkDto.BestModelRequest): List<BenchmarkScore> {
        val modelBenchmark = benchmarkScoreRepository.findAll()
        modelBenchmark.forEach { updateMatrix(it, request) }
        return modelBenchmark
    }

    private fun cosineSimilarity(a: List<Double>, b: List<Double>): Double {
        if (a.isEmpty() || b.isEmpty()) return 0.0
        val size = minOf(a.size, b.size)
        var dot = 0.0
        var normA = 0.0
        var normB = 0.0
        for (k in 0 until size) {
            val x = a[k]
            val y = b[k]
            dot += x * y
            normA += x * x
            normB += y * y
        }
        val denom = sqrt(normA) * sqrt(normB)
        if (denom == 0.0) return 0.0
        return dot / denom
    }
}
