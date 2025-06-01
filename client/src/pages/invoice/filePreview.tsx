import { PreviewWrapper, StyledPaper, RemoveButton, StyledImage, StyledIcon } from './styled'; 
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface FilePreviewProps {
  file: File | null;
  filePreview: string | null;
  onRemove: () => void;
  onPreviewClick: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, filePreview, onRemove, onPreviewClick }) => {
  if (!file) return null;

  return (
    <PreviewWrapper>
      <StyledPaper elevation={3} onClick={onPreviewClick}>
        {/* Remove file button */}
        <RemoveButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </RemoveButton>

        {file.type.startsWith('image/') ? (
          <StyledImage src={filePreview!} alt="Preview" />
        ) : file.type === 'application/pdf' ? (
          <StyledIcon fileType="application/pdf">
            <PictureAsPdfIcon />
          </StyledIcon>
        ) : (
          <StyledIcon fileType="other">
            <InsertDriveFileIcon />
          </StyledIcon>
        )}
      </StyledPaper>
    </PreviewWrapper>
  );
};

export default FilePreview;
