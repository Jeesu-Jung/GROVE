package io.jeesu.grovetaskmixtureservice.application.service

import io.jeesu.grovetaskmixtureservice.domain.mixture.BestModel
import io.jeesu.grovetaskmixtureservice.domain.mixture.BestModelRepository
import io.jeesu.grovetaskmixtureservice.presentation.dto.BestModelDto
import org.springframework.stereotype.Service

@Service
class BestModelService(
    private val repository: BestModelRepository
) {
    fun getAll(): List<BestModel> = repository.findAll()

    fun getTaskMixtureBestModel(model: String, dataSize: Int, task: String): BestModel {
        val bestModel = repository.findByModelAndDataSizeAndTask(
            model = model,
            dataSize = dataSize,
            task = task
        )
        return bestModel ?: throw IllegalArgumentException("No such TaskMixtureBestModel")
    }
}
