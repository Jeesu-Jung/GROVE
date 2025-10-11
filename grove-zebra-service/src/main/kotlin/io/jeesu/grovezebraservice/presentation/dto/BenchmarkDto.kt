package io.jeesu.grovezebraservice.presentation.dto

class BenchmarkDto {
    data class BestModelRequest (
        val includeInstructionFollowing: Boolean,
        val includeKnowledge: Boolean,
        val includeReasoning: Boolean
    )

    data class BestModelResponse (
        val superior: Pair<String, String>,
        val similarity: Pair<String, String>,
        val superiorPlusSimilarity: Pair<String, String>
    )

    data class SimilarityModelRequest (
        val model: String,
        val includeInstructionFollowing: Boolean,
        val includeKnowledge: Boolean,
        val includeReasoning: Boolean
    )

    data class SimilarityModelResponse (
        val model: String
    )
}
