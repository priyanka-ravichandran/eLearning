import { useNavigate } from 'react-router-dom'
import './Register.css'
import React, { useState } from 'react'
import { Container, Row, Col, Form } from 'react-bootstrap'
import logo from '../../../Images/eLearning.png'
import auth from '../../../Images/auth.png'
import { toast } from "react-toastify";

function Register () {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [grade, setGrade] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    let isValid = true
    const errors = {}

    if (!name.match(/^[A-Za-z]+$/)) {
      errors.name = 'Name is invalid'
      isValid = false
    }

    if (!email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      errors.email = 'Email address is invalid'
      isValid = false
    }

    if (!grade.match(/^\d+$/)) {
      errors.grade = 'Grade should be a number'
      isValid = false
    }

    if (password.length < 6) {
      errors.password = 'Password should be at least 6 characters long'
      isValid = false
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Password does not match'
      isValid = false
    }

    setErrors(errors)
    return isValid
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (validateForm()) {
      const userRegistrationData = {
        name: name,
        grade: grade,
        email: email,
        password: password
      }

      fetch(process.env.REACT_APP_BASE_URL + '/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userRegistrationData)
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.status === true) {
            console.log(data)
            localStorage.setItem('userId', data._id)
            toast.success('Registration Successful')
            navigate('/login')
          } else {
            console.log(data.message)
          }
        })
        .catch(error => {
          console.log(error)
        })
    }
  }

  const handleLoginClick = () => {
    navigate('/login')
  }

  return (
    <Container className='register-container' fluid>
      <Row>
        <Col className='left-col' xs={6}>
          <img src={logo} alt='eLearning Logo' className='logo' />
          <div className='register-form pb-0 h-auto'>
            <div className='heading pb-2'>
              <h1>Register</h1>
            </div>
            <Form
              className='form pe-0'
              onSubmit={handleSubmit}
              style={{ textAlign: 'left' }}
            >
              <Form.Group
                className='mb-4'
                controlId='exampleForm.ControlInput1'
              >
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Full Name'
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                  }}
                />
                {errors.name && <p className='text-danger'>{errors.name}</p>}
              </Form.Group>

              <Form.Group
                className='mb-4'
                controlId='exampleForm.ControlInput1'
              >
                <Form.Label>Grade</Form.Label>
                <Form.Control
                  type='number'
                  placeholder='Grade'
                  value={grade}
                  onChange={e => {
                    setGrade(e.target.value)
                  }}
                />
                {errors.grade && <p className='text-danger'>{errors.grade}</p>}
              </Form.Group>

              <Form.Group
                className='mb-4'
                controlId='exampleForm.ControlInput1'
              >
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type='email'
                  placeholder='Email'
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                  }}
                />
                {errors.email && <p className='text-danger'>{errors.email}</p>}
              </Form.Group>

              <Form.Group
                className='mb-4'
                controlId='exampleForm.ControlInput1'
              >
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Password'
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                  }}
                />
                {errors.password && (
                  <p className='text-danger'>{errors.password}</p>
                )}
              </Form.Group>

              <Form.Group
                className='mb-4'
                controlId='exampleForm.ControlInput1'
              >
                <Form.Label>Confirm Password </Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Confirm Password'
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value)
                  }}
                />
                {errors.confirmPassword && (
                  <p className='text-danger'>{errors.confirmPassword}</p>
                )}
              </Form.Group>

              <button className='orange-btn-white-font w-100 p-2 mt-2'>
                Register
              </button>
            </Form>
            <p className='redirect pt-3 m-0'>
              Already Have An Account?{' '}
              <span className='hover underline' onClick={handleLoginClick}>
                Login Here
              </span>
            </p>
          </div>
        </Col>
        <Col xs={6} className='right-col'>
          <div className='right-container d-flex justify-content-center align-items-center'>
            <img src={auth} alt='Auth'></img>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default Register
