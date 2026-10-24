import { AppLoader } from './AppLoader';
import { IsWebSearchEnabled } from '../src/Server/Configuration/WebSearchSettings';

export const dynamic = 'force-dynamic';

export default function Page()
{
  return <AppLoader webSearchEnabled={IsWebSearchEnabled()} />;
}
