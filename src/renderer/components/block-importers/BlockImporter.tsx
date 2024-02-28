import { KapDialog, KapFormDialog, showToasty, ToastType } from '@kapeta/ui-web-components';
import { Button } from '@mui/material';
import { SingleFileResult } from '../../utils/showFilePicker';
import { BlockDefinition } from '@kapeta/schemas';
import { Asset, SchemaKind } from '@kapeta/ui-web-types';

export interface BlockImportResult {
    data: BlockDefinition;
    content(): JSX.Element;
    apply(data: SchemaKind): Promise<Asset>;
}

export interface BlockImportProvider {
    filename: string;
    create(handle: string, file: SingleFileResult): Promise<BlockImportResult>;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onImported: (asset: Asset) => void;
    file: BlockImportResult | null;
}

export const BlockImporter = (props: Props) => {
    const InnerComponent = props.file?.content;
    return (
        <KapFormDialog
            initialValue={props.file?.data}
            onSubmitData={async (data) => {
                try {
                    const asset = await props.file?.apply(data);
                    if (asset) {
                        props.onImported(asset);
                    }
                    props.onClose();
                } catch (e: any) {
                    showToasty({
                        message: `Failed to import block: ${e.message}`,
                        type: ToastType.ALERT,
                        title: 'Import failed',
                    });
                }
            }}
            open={props.open}
            onClose={props.onClose}
            title={`Importing block...`}
        >
            <KapDialog.Content>{InnerComponent && <InnerComponent />}</KapDialog.Content>
            <KapDialog.Actions>
                <Button onClick={props.onClose}>Cancel</Button>
                <Button type={'submit'} variant={'contained'} color={'primary'}>
                    Import block
                </Button>
            </KapDialog.Actions>
        </KapFormDialog>
    );
};
