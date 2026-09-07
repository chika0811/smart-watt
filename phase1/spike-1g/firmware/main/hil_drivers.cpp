#include "hil_drivers.h"
#include <stdio.h>
#include <string.h>

HilHardwareDrivers::HilHardwareDrivers() : simulated_rtc_sec_(1772193600) {
    memset(relay_states_, 0, sizeof(relay_states_));
}

HilHardwareDrivers::~HilHardwareDrivers() {}

bool HilHardwareDrivers::init_esp32_ds_peripheral() {
    // In actual ESP-IDF: call esp_ds_sign() with eFuse key block
    printf("[HIL-DRIVER] ESP32-S3 Hardware DS Peripheral & eFuse Key Block initialized.\n");
    return true;
}

bool HilHardwareDrivers::init_relays() {
    memset(relay_states_, 0, sizeof(relay_states_));
    printf("[HIL-DRIVER] 8-Channel Relay GPIO Driver initialized (Active-High Optocoupler).\n");
    return true;
}

bool HilHardwareDrivers::init_rtc() {
    printf("[HIL-DRIVER] PCF8563 I2C RTC Driver initialized.\n");
    return true;
}

bool HilHardwareDrivers::init_metrology() {
    printf("[HIL-DRIVER] ADE7953 Isolated SPI Metrology IC Driver initialized.\n");
    return true;
}

bool HilHardwareDrivers::init_presence_sensor() {
    printf("[HIL-DRIVER] LD2410B mmWave Presence Sensor UART Driver initialized.\n");
    return true;
}

bool HilHardwareDrivers::set_relay(uint8_t channel, bool state) {
    if (channel >= 8) return false;
    relay_states_[channel] = state;
    return true;
}

bool HilHardwareDrivers::get_relay(uint8_t channel) const {
    if (channel >= 8) return false;
    return relay_states_[channel];
}

bool HilHardwareDrivers::get_rtc_time(uint64_t* out_sec) {
    if (!out_sec) return false;
    *out_sec = simulated_rtc_sec_;
    return true;
}

bool HilHardwareDrivers::set_rtc_time(uint64_t sec) {
    simulated_rtc_sec_ = sec;
    return true;
}

bool HilHardwareDrivers::read_metrology(hil_metrology_data_t* out_data) {
    if (!out_data) return false;
    out_data->voltage_rms = 230.4f;
    out_data->total_current_rms = 3.85f;
    out_data->active_power = 850.2f;
    out_data->apparent_power = 887.0f;
    out_data->power_factor = 0.958f;
    out_data->total_energy_kwh = 142.85;
    return true;
}

bool HilHardwareDrivers::read_presence(hil_presence_data_t* out_data) {
    if (!out_data) return false;
    out_data->presence_state = 1; // PRESENT
    out_data->confidence = 98;
    out_data->distance_cm = 180;
    return true;
}
