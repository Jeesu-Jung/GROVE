package io.jeesu.grovezebraservice.application.mapper

import io.jeesu.grovezebraservice.presentation.dto.BenchmarkDto
import org.springframework.stereotype.Component

@Component
class BenchmarkMapper {
    fun toBestModelRequest(request: BenchmarkDto.SimilarityModelRequest): BenchmarkDto.BestModelRequest {
        return BenchmarkDto.BestModelRequest(
            includeInstructionFollowing = request.includeInstructionFollowing,
            includeKnowledge = request.includeKnowledge,
            includeReasoning = request.includeReasoning
        )
    }
}
