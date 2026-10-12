# Wonlex GPS Watch TCP Protocol Reference

## 1. General Protocol Format

The protocol uses the following format:
`[manufacturer*device ID*content length*content]`

### Components:
- **Manufacturer Code:** Fixed 2-byte identifier (e.g., `3G`, `CS`).
- **Device ID:** 10-digit numeric string derived from the device's IMEI.
- **Content Length:** 4-byte ASCII hex code representing the length of the payload (content), zero-padded. High bit is in the front.
  - *Example:* `00A2` indicates the length is 162 decimal.
- **Content:** Command parameters separated by commas.

---

## 2. Core Commands (Device to Server)

| Command | Name | Description | Example |
| :--- | :--- | :--- | :--- |
| **LK** | Link Maintenance | Heartbeat to maintain connection. | `[3G*8800000015*000D*LK,50,100,100]` |
| **UD** | Location Data | Real-time location data report. | `[3G*2016001000*00BC*UD,120118,070625,A,22.570720,N,113.8620167,E,0.00,188.6,0.0,9,100,51,14188,0,00000010,6,255,460,0,9360,5081,156,9360,4081,129,9360,4151,128,9360,5082,127,9360,4723,122,9360,4082,120,5,buyaoxialian,a0:c5:f2:b0:7.4:d0,-34,3gtc-5g,92:76:9f:48:4f:20,-48,726,38:37:8b:7:cf:99,-54,3gtc,d0:ae:ec:96:10:54,-63,ceshi,d0:ae:ec:96:10: 55,-64,22.4]` |
| **UD2** | Blind Spot Data | Re-uploads location data when offline connection is restored. | Same format as `UD` |
| **AL** | Alarm Data | Report alarms (e.g., SOS, Low Battery, etc.). | `[3G*8800000015*0002*AL]` |
| **CONFIG** | Config Command | Upload current device configuration. | `[3G*8800000015*len*CONFIG,G75,UL:600,SY:1,CM:1]` |

---

## 3. Server Commands (Server to Device)

| Command | Name | Description | Example |
| :--- | :--- | :--- | :--- |
| **IP** | IP & Port Config | Change the server IP and port. | `[3G*8800000015*0014*IP,156.229.16.166,8001]` |
| **UPLOAD** | Upload Interval | Set data upload frequency (seconds). | `[3G*8800000015*0009*UPLOAD,600]` |
| **MONITOR** | Monitoring | Terminal initiates a silent automatic call back. | `[3G*8800000015*000F*MONITOR,13600000000]` |
| **SOS** | SOS Numbers | Set up to 3 SOS numbers. | `[3G*8800000015*0027*SOS,00000000000,00000000000,00000000000]` |
| **LANG** | Language | Set device language. | `[3G*8800000015*0006*LANG,1]` |
| **ZONE** | Time Zone | Set device time zone. | `[3G*8800000015*0006*ZONE,8]` |
| **CENTER** | SMS Center | Set SMS alarm receiving number. | `[3G*8800000015*0012*CENTER,00000000000]` |
| **SOSMS** | SOS SMS Switch | 0: Off, 1: On. | `[3G*8800000015*0008*SOSMS,1]` |
| **LOWBAT** | Low Battery SMS | 0: Off, 1: On. | `[3G*8800000015*0008*LOWBAT,1]` |
| **REMOVE** | Bracelet Remove | Switch for remove bracelet alarm. | `[3G*8800000015*0008*REMOVE,1]` |
| **VERNO** | Version Query | Query terminal software version. | `[3G*8800000015*0005*VERNO]` |
| **CR** | Position Command | Wake up GPS for continuous positioning. | `[3G*8800000015*0002*CR]` |
| **POWEROFF** | Power Off | Shutdown device. | `[3G*8800000015*0008*POWEROFF]` |
| **RESET** | Restart | Reboot device. | `[3G*8800000015*0005*RESET]` |
| **SILENCETIME2** | Class Period | Set periods where watch is silent. | `[3G*5678901234*0037*SILENCETIME2,21:10-7:30-0111110,21:10-7:30-0111110,21:10-7:30-0111110,21:10-7:30-0111110]` |
| **WALKTIME** | Pedometer Period | Set step calculation period. | `[3G*5678901234*002A*WALKTIME,8:10-9:30,10:10-11:30,12:10-13:30]` |
| **SLEEPTIME** | Overturn Period | Set overturn detection period. | `[3G*5678901234*0014*SLEEPTIME,21:10-7:30]` |
| **FIND** | Find Watch | Make watch ring for 1 minute. | `[3G*5678901234*0004*FIND]` |
| **REMIND** | Alarm Clock | Set up to 3 alarms. | `[3G*5678901234*0018*REMIND,08:10-1-1,08:10-1-2,08:10-1-3-0111110]` |
| **SCHEDULE** | Class Schedule | Set curriculum (Unicode). | `[3G*3916111448*0071*SCHEDULE,07000800-00000000-00000000-00000000-00000000-0000000-00000000-00000000,661f671f4e00005f0031005f8bed6587]` |
| **PHB** | Phonebook | Set up to 15 children/elderly/android contacts. | `[3G*5678901234*001B*PHB,313131,597D003100320033]` |
| **TK** | Intercom (Voice) | Send/receive audio messages (ARM format). | `[3G*5678901234*len*TK,audio_data]` |
| **MESSAGE** | Message Display | Send text to display (Unicode). | `[3G*5678901234*0018*MESSAGE,597D003100320033]` |
| **FACTORY** | Restore Factory | Reset to factory settings. | `[3G*8800000015*0007*FACTORY]` |
| **FLOWER** | Rewards | Send reward flowers to screen. | `[3G*8800000015*0008*FLOWER,5]` |
| **RCAPTURE** | Remote Photo | Take a photo remotely. | `[3G*880000015*len*rcapture]` |
| **PP** | Make Friends | Issuing protocol for friends. | `[3G*8800000015*00D4*PP,time,loc_data]` |
| **PROFILE** | Scene Mode | 1: Vibration, 2: Bell, 3: Vib+Bell, 4: Mute. | `[3G*8800000015*len*profile,x]` |
| **BTEMP2** | Temp Protocol | Body temperature reporting. | `[3G*8800000015*len*btemp2,type,temp]` |
| **APN** | APN Setting | Set device APN. | `[3G*8800000015*0011*apn,cmnet,,,20634]` |
| **WT** | Weather | Send weather data to watch. | `[3G*9403043989*009F*WT,loc_data,date,temp,weather_desc,city]` |
| **HRTSTART** | Heart Rate | Start heart rate measurement. | `[3G*8800000015*len*hrtstart,300]` |
| **BPHRT** | BP & HR | Blood pressure and heart rate upload. | `[3G*8800000015*len*bphrt,high_bp,low_bp,hr,height,weight]` |
| **FALLDOWN** | Fall Alarm | Fall alarm switch and settings. | `[3G*8800000015*len*FALLDOWN,1,1]` |
| **TAKEPILLS** | Medicine Remind | Medication reminders. | `[3G*8800000015*len*TAKEPILLS,reminder_setting]` |

---

## 4. 4G/LTE Specific

- **WIFISEARCH:** Search for nearby Wi-Fi.
- **WIFISET:** Set Wi-Fi connection.
- **WIFIDEL:** Delete Wi-Fi.
- **APPANDFNREPORT:** Application management report.
- **SETAPPFNTIMEORDISABLE:** Disable apps or set time limits.
- **DEVACTIVEFNINFO:** Request application list.
- **DSAPPFNDISABLE:** Disable/Enable specific apps.

---

## 5. Location Data Parsing (Appendix 1)

Content part of `UD` or `AL`:
`date,time,A/V,lat,N/S,lon,E/W,speed,direction,altitude,satellites,gsm_signal,battery,steps,turnover_times,status,base_info...`

- **A/V:** A (Valid Positioning), V (Invalid).
- **Status (Hex String):**
  - bit 0: low battery
  - bit 1: out fence
  - bit 2: in fence
  - bit 3: wrist band status
  - bit 4: watch running static
  - bit 16: SOS alarm
  - bit 17: low battery alarm
  - bit 18: out fence alarm
  - bit 19: in fence alarm
  - bit 20: wristband takeoff alarm
  - bit 21: fall off SOS alarm
  - bit 22: abnormal heart rate alarm
