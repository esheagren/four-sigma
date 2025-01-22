import PropTypes from 'prop-types';

function SubmitButton({ onClick, disabled }) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`submit-button ${disabled ? 'submit-button-disabled' : ''}`}
        >
            Submit Answer
        </button>
    );
}

SubmitButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool
};

export default SubmitButton;

