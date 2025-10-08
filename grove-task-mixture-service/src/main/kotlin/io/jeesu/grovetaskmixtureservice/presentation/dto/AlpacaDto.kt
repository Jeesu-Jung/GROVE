package io.jeesu.grovetaskmixtureservice.presentation.dto

class AlpacaDto {
    data class SearchRequest(
        val model: String,
        val dataSize: Int,
        val task: String
    )

    data class SearchResponse(
        val input: String,
        val inputs: String,
        val constraint: String,
        val output: String,
        val instruction: String
    )
}
