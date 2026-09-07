idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES esp_hw_support esp_system esp_efuse mbedtls
)
