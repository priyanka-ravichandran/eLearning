import React, { useEffect } from 'react';
import './modal.css';
import close_icon from '../../Images/modal/close_icon.svg';

const Modal = ({isModalOpen, setIsModalOpen, title, content}) => {
  useEffect(() => {
    if (isModalOpen && typeof window != 'undefined' && window.document) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  },[isModalOpen])

  return (
    <div className={`modal-container ${isModalOpen ? 'd-block' : 'd-none'} position-absolute top-0 left-0`}>
      <div className='inner-modal bg-white'>
        <div className='modal-header-custom'>
          <h1>{title}</h1>
          <img src={close_icon} alt='close' className='close_icon' onClick={() => setIsModalOpen(false)}/>
        </div>
        <div className='modal-content'>
          {content}
        </div>
      </div>
    </div>
  )
}

export default Modal