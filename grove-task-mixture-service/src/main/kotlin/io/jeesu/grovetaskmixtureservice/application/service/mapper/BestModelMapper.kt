package io.jeesu.grovetaskmixtureservice.application.service.mapper

import io.jeesu.grovetaskmixtureservice.domain.mixture.BestModel
import io.jeesu.grovetaskmixtureservice.presentation.dto.BestModelDto
import org.springframework.stereotype.Component

@Component
class BestModelMapper {
    fun toBestModelResponse(bestModel: BestModel): BestModelDto.BestModelResponse {
        return BestModelDto.BestModelResponse(
            model = bestModel.model,
            dataSize = bestModel.dataSize,
            task = bestModel.task
        )
    }
}
