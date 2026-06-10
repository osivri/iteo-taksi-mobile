import { ServiceRequestScreen } from '@/components/ServiceRequestScreen';
import { SERVICE_MODULES } from '@/lib/service-modules';

export default function ServiceInsuranceScreen() {
  return <ServiceRequestScreen module={SERVICE_MODULES[1]} />;
}
