package io.jeesu.grovetaskmixtureservice.presentation.dto

class AlpacaDto {
    data class SearchRequest(
        val model: String,
        val dataSize: Int,
        val task: String
    )

    data class SearchResponse(
        val items: List<SearchResponseItem>,
        val bestModelDataSizeInfo: BestModelDataSizeInfo
    )

    data class BestModelDataSizeInfo(
        val programming: Int,
        val math: Int,
        val creativeWriting: Int,
        val grammar: Int,
        val history: Int
    )

    data class SearchResponseItem(
        val input: String,
        val inputs: String,
        val constraint: String,
        val output: String,
        val instruction: String
    )
}
