#include "hil_drivers.h"
#include <stdio.h>
#include <assert.h>

extern "C" void app_main(void) {
    printf("===================================================================\n");
    printf(" NOSKYTECH PHASE 1G — ESP32-S3 HIL PHYSICAL TARGET BENCH ENTRY     \n");
    printf("===================================================================\n");

    HilHardwareDrivers drivers;
    assert(drivers.init_esp32_ds_peripheral());
    assert(drivers.init_relays());
    assert(drivers.init_rtc());
    assert(drivers.init_metrology());
    assert(drivers.init_presence_sensor());

    // Relay Actuation Test
    drivers.set_relay(0, true);
    assert(drivers.get_relay(0) == true);
    printf("[HIL-PASS] Relay CH1 actuated ON successfully.\n");

    // Metrology Acquisition Test
    hil_metrology_data_t metro;
    assert(drivers.read_metrology(&metro));
    printf("[HIL-PASS] Metrology: V=%.1fV, I=%.2fA, P=%.1fW, PF=%.3f, E=%.2fkWh\n",
           metro.voltage_rms, metro.total_current_rms, metro.active_power, metro.power_factor, metro.total_energy_kwh);

    // Presence Acquisition Test
    hil_presence_data_t pres;
    assert(drivers.read_presence(&pres));
    printf("[HIL-PASS] Presence Sensor: State=%d, Confidence=%d%%, Range=%dcm\n",
           pres.presence_state, pres.confidence, pres.distance_cm);

    printf("===================================================================\n");
    printf(" [SUCCESS] HIL FIRMWARE TARGET BENCH HARDWARE DRIVERS READY.       \n");
    printf("===================================================================\n");
}
