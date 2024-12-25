import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArduinoApiClient } from '../api/arduinoApi';
import { ArduinoDevice, DeviceSettings } from '../types/arduino';

export const useArduinoDevices = (client: ArduinoApiClient) => {
  const queryClient = useQueryClient();

  // Fetch all devices
  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useQuery<ArduinoDevice[]>(['devices'], () => client.getDevices());

  // Fetch device properties
  const useDeviceProperties = (deviceId: string) => {
    return useQuery(['deviceProperties', deviceId], () =>
      client.getDeviceProperties(deviceId)
    );
  };

  // Update device settings
  const useUpdateDeviceSettings = () => {
    return useMutation(
      ({
        deviceId,
        propertyId,
        settings,
      }: {
        deviceId: string;
        propertyId: string;
        settings: Partial<DeviceSettings>;
      }) => client.updateDeviceSettings(deviceId, propertyId, settings),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['deviceProperties']);
        },
      }
    );
  };

  // Get device status
  const useDeviceStatus = (deviceId: string) => {
    return useQuery(['deviceStatus', deviceId], () =>
      client.getDeviceStatus(deviceId),
      {
        refetchInterval: 30000, // Refetch every 30 seconds
      }
    );
  };

  return {
    devices,
    isLoadingDevices,
    devicesError,
    useDeviceProperties,
    useUpdateDeviceSettings,
    useDeviceStatus,
  };
}; 