import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { Root } from './Root';
import { theme } from './Theme';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
    <ThemeProvider theme={theme}>
        <Root />
    </ThemeProvider>
);
