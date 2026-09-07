#ifndef HIL_DRIVERS_H
#define HIL_DRIVERS_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Electrical Metrology Sample Struct
typedef struct {
    float voltage_rms;       // V
    float total_current_rms; // A
    float active_power;      // W
    float apparent_power;    // VA
    float power_factor;      // cos(theta)
    double total_energy_kwh; // kWh
} hil_metrology_data_t;

// Presence Sensor Data Struct
typedef struct {
    uint8_t presence_state; // 0=ABSENT, 1=PRESENT, 2=UNKNOWN
    uint8_t confidence;     // 0 - 100%
    uint32_t distance_cm;
} hil_presence_data_t;

// Driver functions for Hardware-in-the-Loop Bench
class HilHardwareDrivers {
public:
    HilHardwareDrivers();
    ~HilHardwareDrivers();

    bool init_esp32_ds_peripheral();
    bool init_relays();
    bool init_rtc();
    bool init_metrology();
    bool init_presence_sensor();

    // Relay Actuation
    bool set_relay(uint8_t channel, bool state);
    bool get_relay(uint8_t channel) const;

    // RTC Interface
    bool get_rtc_time(uint64_t* out_sec);
    bool set_rtc_time(uint64_t sec);

    // Metrology Interface
    bool read_metrology(hil_metrology_data_t* out_data);

    // Presence Sensor Interface
    bool read_presence(hil_presence_data_t* out_data);

private:
    bool relay_states_[8];
    uint64_t simulated_rtc_sec_;
};

#ifdef __cplusplus
}
#endif

#endif // HIL_DRIVERS_H
