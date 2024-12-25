import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArduinoDevice, DeviceSettings } from '@/types/arduino';
import { ArduinoApiClient } from '@/api/arduinoApi';

export function useArduinoDevices(client: ArduinoApiClient | null) {
  const queryClient = useQueryClient();

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: () => client?.getDevices() ?? Promise.resolve([]),
    enabled: !!client,
  });

  const devicePropertiesQuery = useQuery({
    queryKey: ['deviceProperties', devicesQuery.data?.[0]?.id],
    queryFn: () => 
      devicesQuery.data?.[0]?.id 
        ? client?.getDeviceProperties(devicesQuery.data[0].id) 
        : Promise.resolve([]),
    enabled: !!client && !!devicesQuery.data?.[0]?.id,
  });

  const deviceSettingsQuery = useQuery({
    queryKey: ['deviceSettings', devicesQuery.data?.[0]?.id],
    queryFn: () => 
      devicesQuery.data?.[0]?.id 
        ? client?.getDeviceSettings(devicesQuery.data[0].id)
        : Promise.resolve(null),
    enabled: !!client && !!devicesQuery.data?.[0]?.id,
  });

  const updateDeviceSettingsMutation = useMutation({
    mutationFn: ({ 
      deviceId, 
      settings 
    }: { 
      deviceId: string;
      settings: Partial<DeviceSettings>;
    }) => client?.updateDeviceSettings(deviceId, settings) ?? Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries(['deviceProperties']);
      queryClient.invalidateQueries(['deviceSettings']);
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ 
      deviceId, 
      propertyId, 
      value 
    }: { 
      deviceId: string;
      propertyId: string;
      value: any;
    }) => client?.updateProperty(deviceId, propertyId, value) ?? Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries(['deviceProperties']);
      queryClient.invalidateQueries(['deviceSettings']);
    },
  });

  return {
    devices: devicesQuery.data ?? [],
    deviceProperties: devicePropertiesQuery.data ?? [],
    deviceSettings: deviceSettingsQuery.data,
    isLoading: devicesQuery.isLoading || devicePropertiesQuery.isLoading || deviceSettingsQuery.isLoading,
    isError: devicesQuery.isError || devicePropertiesQuery.isError || deviceSettingsQuery.isError,
    error: devicesQuery.error || devicePropertiesQuery.error || deviceSettingsQuery.error,
    updateDeviceSettings: updateDeviceSettingsMutation.mutate,
    updateProperty: updatePropertyMutation.mutate,
  };
} 