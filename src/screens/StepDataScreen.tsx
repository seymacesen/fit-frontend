// src/screens/StepDataScreen.tsx

import React, { useEffect, useState } from "react";
import { Text, View, Button, ScrollView, Alert } from "react-native";
import {
    requestPermission,
    getGrantedPermissions,
    readRecords,
    initialize,
    type Permission,
    type RecordResult,
} from "react-native-health-connect";

type StepRecord = RecordResult<"Steps">;

export default function StepDataScreen() {
    const [steps, setSteps] = useState<StepRecord[]>([]);
    const [isReady, setIsReady] = useState(false);

    const fetchSteps = async () => {
        if (!isReady) {
            Alert.alert("Uyarı", "Lütfen Health Connect başlatılsın, sonra tekrar deneyin.");
            return;
        }

        try {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const response = await readRecords("Steps", {
                timeRangeFilter: {
                    operator: "between",
                    startTime: yesterday.toISOString(),
                    endTime: today.toISOString(),
                },
            });

            setSteps(response.records);
        } catch (error) {
            console.error("Adım verisi okunamadı:", error);
            Alert.alert("Hata", "Adım verisi alınamadı.");
        }
    };

    const handlePermissions = async () => {
        try {
            const permissions: Permission[] = [
                { accessType: "read", recordType: "Steps" },
            ];

            const granted = await getGrantedPermissions();
            const alreadyGranted = permissions.every((p) =>
                granted.some(
                    (g) =>
                        g.accessType === p.accessType && g.recordType === p.recordType
                )
            );

            if (!alreadyGranted) {
                await requestPermission(permissions);
            }
        } catch (error) {
            console.error("İzin alınamadı:", error);
            Alert.alert("Hata", "Gerekli izinler alınamadı.");
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const isInitialized = await initialize();
                if (!isInitialized) {
                    console.error("Health Connect başlatılamadı");
                    Alert.alert("Hata", "Health Connect başlatılamadı. Cihaz desteklemiyor olabilir.");
                    return;
                }

                console.log("✅ Health Connect başlatıldı");
                await handlePermissions();
                setIsReady(true);
            } catch (error) {
                console.error("Health Connect başlatılamadı:", error);
                Alert.alert("Hata", "Health Connect başlatılamadı.");
            }
        };

        init();
    }, []);

    return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
                Son 24 Saatlik Adım Verisi
            </Text>

            <Button title="Adımları Getir" onPress={fetchSteps} />

            {steps.map((item, index) => (
                <View key={index} style={{ marginVertical: 10 }}>
                    <Text>Adım Sayısı: {item.count}</Text>
                    <Text>Başlangıç: {item.startTime}</Text>
                    <Text>Bitiş: {item.endTime}</Text>
                </View>
            ))}
        </ScrollView>
    );
}
