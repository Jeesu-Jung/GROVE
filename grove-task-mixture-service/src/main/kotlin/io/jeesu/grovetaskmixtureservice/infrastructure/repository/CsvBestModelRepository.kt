package io.jeesu.grovetaskmixtureservice.infrastructure.repository

import io.jeesu.grovetaskmixtureservice.domain.mixture.BestModel
import io.jeesu.grovetaskmixtureservice.domain.mixture.BestModelRepository
import org.springframework.core.io.ResourceLoader
import org.springframework.stereotype.Repository
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

@Repository
class CsvBestModelRepository(
    private val resourceLoader: ResourceLoader
) : BestModelRepository {

    private val cached: List<BestModel> by lazy { loadCsv() }

    override fun findAll(): List<BestModel> = cached

    override fun findByModelAndDataSizeAndTask(model: String, dataSize: Int, task: String): BestModel? {
        return cached.find { it.model == model && it.dataSize == dataSize && it.task == task }
    }

    private fun loadCsv(): List<BestModel> {
        val resource = resourceLoader.getResource("classpath:task_mixture_best_model.csv")
        if (!resource.exists()) return emptyList()

        val results = mutableListOf<BestModel>()
        resource.inputStream.use { inputStream ->
            BufferedReader(InputStreamReader(inputStream, StandardCharsets.UTF_8)).use { reader ->
                reader.lineSequence()
                    .drop(1) // skip header
                    .filter { it.isNotBlank() }
                    .forEach { line ->
                        val parts = line.split(',')
                        if (parts.size < 9) return@forEach

                        // Columns: model(0), data_size(1), task(2), best_model(3 - ignored), programming(4), math(5), creative writing(6), grammar(7), history(8)
                        val model = parts[0].trim()
                        val dataSize = parts[1].trim().toIntOrNull() ?: return@forEach
                        val task = parts[2].trim()
                        val programming = parts[4].trim().toIntOrNull() ?: return@forEach
                        val math = parts[5].trim().toIntOrNull() ?: return@forEach
                        val creativeWriting = parts[6].trim().toIntOrNull() ?: return@forEach
                        val grammar = parts[7].trim().toIntOrNull() ?: return@forEach
                        val history = parts[8].trim().toIntOrNull() ?: return@forEach

                        results.add(
                            BestModel(
                                model = model,
                                dataSize = dataSize,
                                task = task,
                                programming = programming,
                                math = math,
                                creativeWriting = creativeWriting,
                                grammar = grammar,
                                history = history
                            )
                        )
                    }
            }
        }
        return results
    }
}
