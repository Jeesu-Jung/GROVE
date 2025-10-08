package io.jeesu.grovetaskmixtureservice.application.service

import io.jeesu.grovetaskmixtureservice.domain.seed.SeedSentence
import io.jeesu.grovetaskmixtureservice.domain.seed.SeedSentenceRepository
import org.springframework.stereotype.Service

@Service
class SeedSentenceService(
    private val repository: SeedSentenceRepository
) {
    private val cached: List<SeedSentence> by lazy {
        val collected = mutableListOf<SeedSentence>()
        var page = 0
        val batchSize = 100
        while (true) {
            val items = repository.findAll(page, batchSize)
            if (items.isEmpty()) break
            collected.addAll(items)
            if (items.size < batchSize) break
            page += 1
        }
        collected.toList()
    }

    fun getAll(batchSize: Int = 100): List<SeedSentence> = cached

    fun getAvgVector(type: String): List<Float> {
        val vectors = cached
            .asSequence()
            .filter { it.type == type }
            .mapNotNull { it.vector }
            .toList()

        if (vectors.isEmpty()) return emptyList()

        val dimension = vectors.first().size
        val sums = DoubleArray(dimension)
        for (vec in vectors) {
            for (i in 0 until dimension) {
                sums[i] += vec[i].toDouble()
            }
        }

        val count = vectors.size
        return (0 until dimension).map { (sums[it] / count).toFloat() }
    }
}
