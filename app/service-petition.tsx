import { ServiceRequestScreen } from '@/components/ServiceRequestScreen';
import { SERVICE_MODULES } from '@/lib/service-modules';

export default function ServicePetitionScreen() {
  return <ServiceRequestScreen module={SERVICE_MODULES[4]} />;
}
