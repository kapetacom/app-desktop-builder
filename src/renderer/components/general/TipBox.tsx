import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    Modal,
    Paper,
    Slide,
    Stack,
    Typography,
} from '@mui/material';
import { useLocalStorage } from 'react-use';
import { useCallback } from 'react';

interface Props {
    id: string;
    description: string;
    title: string;
    closeButtonLabel?: string;
    icon: React.ReactNode;
}

export const TipBox = (props: Props) => {
    const [open, setOpen] = useLocalStorage<boolean>(props.id, true);

    const onClose = useCallback(() => setOpen(false), []);

    return (
        <Modal
            open={Boolean(open)}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(2px)',
                    bgcolor: 'transparent',
                },
            }}
            onClose={onClose}
        >
            <Slide direction={'left'} in={Boolean(open)}>
                <Paper
                    elevation={3}
                    sx={{
                        width: '550px',
                        position: 'absolute',
                        right: '24px',
                        bottom: '24px',
                        boxShadow: 24,
                        ':focus-visible': {
                            outline: 'none',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontWeight: 600,
                        }}
                    >
                        {props.title}
                    </DialogTitle>
                    <DialogContent
                        sx={{
                            py: 0,
                        }}
                    >
                        <Stack direction={'row'} alignItems={'center'}>
                            <Box
                                sx={{
                                    py: 1,
                                    px: 0.5,
                                    svg: {
                                        width: '100%',
                                        height: '100%',
                                    },
                                }}
                            >
                                {props.icon}
                            </Box>
                            <Typography>{props.description}</Typography>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button color={'primary'} onClick={onClose}>
                            {props.closeButtonLabel ?? 'Dismiss'}
                        </Button>
                    </DialogActions>
                </Paper>
            </Slide>
        </Modal>
    );
};
