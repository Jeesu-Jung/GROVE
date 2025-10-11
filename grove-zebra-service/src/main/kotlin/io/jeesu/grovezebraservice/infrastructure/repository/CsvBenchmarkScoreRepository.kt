package io.jeesu.grovezebraservice.infrastructure.repository

import io.jeesu.grovezebraservice.domain.benchmark.BenchmarkScore
import io.jeesu.grovezebraservice.domain.benchmark.BenchmarkScoreRepository
import org.springframework.core.io.ResourceLoader
import org.springframework.stereotype.Repository
import java.math.BigDecimal

@Repository
class CsvBenchmarkScoreRepository(
    private val resourceLoader: ResourceLoader
) : BenchmarkScoreRepository {

    private val cached: List<BenchmarkScore> by lazy { loadCsv() }

    override fun findAll(): List<BenchmarkScore> = cached

    private fun loadCsv(): List<BenchmarkScore> {
        val resource = resourceLoader.getResource("classpath:benchmark_scores.csv")
        val lines = resource.inputStream.bufferedReader().use { it.readLines() }
        if (lines.isEmpty()) return emptyList()

        // Header: A(blank), B(blank), C("metric"), D..= model names
        val headerColumns = lines.first().split(",")
        if (headerColumns.size < 4) return emptyList()
        val modelNames: List<String> = headerColumns.drop(3).map { it.trim() }

        // Accumulate dataset scores per model using B-column labels
        val modelToDatasetScores: MutableMap<String, MutableMap<String, Double>> =
            modelNames.associateWith { mutableMapOf<String, Double>() }.toMutableMap()

        fun parseNumeric(raw: String, multiplyByHundred: Boolean): Double {
            val trimmed = raw.trim()
            val withoutPercent = if (trimmed.endsWith("%")) trimmed.removeSuffix("%") else trimmed
            val value = withoutPercent.toDoubleOrNull() ?: 0.0
            return if (multiplyByHundred) value.toBigDecimal().multiply(BigDecimal.valueOf(100)).toDouble() else value
        }

        lines.drop(1).forEach { line ->
            if (line.isBlank()) return@forEach
            val cols = line.split(",")
            if (cols.size < 4) return@forEach

            val datasetName = cols[1].trim() // From B column
            val multiply100 = datasetName.equals("MMLU-pro", ignoreCase = true)

            val values = cols.drop(3)
            values.forEachIndexed { index, rawValue ->
                if (index >= modelNames.size) return@forEachIndexed
                val modelName = modelNames[index]
                val numeric = parseNumeric(rawValue, multiply100)
                modelToDatasetScores[modelName]?.set(datasetName, numeric)
            }
        }

        val excludeModels = setOf(
            "UltraLM-13B",
            "UltraLM-65B",
            "WizardLM-13B",
            "Vicuna-33B",
            "Alpaca-7B",
            "Falcon-40B-instruct",
            "MPT-30B-chat",
            "StarChat-Beta",
            "Pythia-12B"
        )

        return modelNames
            .filter { excludeModels.contains(it).not() }
            .map { modelName ->
                val datasetScores = modelToDatasetScores[modelName] ?: emptyMap()
                BenchmarkScore(
                    model = modelName,
                    accuracyIFeval = datasetScores["Instruction-Following Evaluation(IFeval)"] ?: 0.0,
                    accuracyMMLU = datasetScores["MMLU"] ?: 0.0,
                    accuracyMMLUPro = datasetScores["MMLU-pro"] ?: 0.0,
                    accuracyArcEasy = datasetScores["ARC-easy"] ?: 0.0,
                    accuracyArcChallenge = datasetScores["ARC-Challenge"] ?: 0.0,
                    accuracyHellaswag = datasetScores["Hellaswag"] ?: 0.0
                )
            }
    }
}
