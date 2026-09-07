idf_component_register(
    SRCS "main.cpp" "noise_transport.cpp"
    INCLUDE_DIRS "."
    REQUIRES esp_system mbedtls
)
