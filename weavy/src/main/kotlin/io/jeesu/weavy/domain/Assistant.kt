package io.jeesu.weavy.domain

interface Assistant {
    fun answer(query: String?): String
}
