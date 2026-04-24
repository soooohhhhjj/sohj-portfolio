import { OverlayModal } from '../OverlayModal/OverlayModal';
import './ResumeDisclaimerModal.css';

type ResumeDisclaimerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResumeDisclaimerModal({
  isOpen,
  onClose,
  onConfirm,
}: ResumeDisclaimerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onClose}
      rootClassName="resume-disclaimer-modal"
      backdropClassName="resume-disclaimer-modal__backdrop"
      dialogClassName="resume-disclaimer-modal__dialog"
      bodyClassName="resume-disclaimer-modal__body"
      titleId="resume-disclaimer-modal-title"
      rootKey="resume-disclaimer-modal"
      header={(
        <div className="resume-disclaimer-modal__header">
          <h3 id="resume-disclaimer-modal-title" className="resume-disclaimer-modal__title font-anta">
            Resume Notice
          </h3>
        </div>
      )}
      footer={(
        <div className="resume-disclaimer-modal__footer">
          <button
            type="button"
            className="resume-disclaimer-modal__button font-jura"
            onClick={onConfirm}
          >
            Okay
          </button>
        </div>
      )}
    >
      <p className="resume-disclaimer-modal__copy font-jura">
        This is a general version of my resume. Please note that the resume shown here may be different from the one
        I used for a specific application.
      </p>
    </OverlayModal>
  );
}
