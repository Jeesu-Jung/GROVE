package io.jeesu.grovetaskmixtureservice.presentation.dto

class BestModelDto {
    data class BestModelResponse(
        val model: String,
        val dataSize: Int,
        val task: String
    )
}
