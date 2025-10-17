package io.jeesu.weavy.infrastucture.util

import java.net.URISyntaxException
import java.net.URL
import java.nio.file.Path
import java.nio.file.Paths

object Utils {
    fun toPath(relativePath: String?): Path {
        try {
            val fileUrl: URL? = Utils::class.java.classLoader.getResource(relativePath)
            return Paths.get(fileUrl!!.toURI())
        } catch (e: URISyntaxException) {
            throw RuntimeException(e)
        }
    }
}
