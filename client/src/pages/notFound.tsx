import { Link } from 'react-router-dom';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8f9fa;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: 3rem;
  color: #343a40;
`;

const Message = styled.p`
  font-size: 1.2rem;
  color: #6c757d;
`;

const HomeLink = styled(Link)`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;

  &:hover {
    background-color: #0056b3;
  }
`;

const NotFound: React.FC = () => {
  return (
    <Container>
      <Heading>404 - Page Not Found</Heading>
      <Message>Sorry, the page you are looking for does not exist.</Message>
      <HomeLink to="/">Go back to Home</HomeLink>
    </Container>
  );
};

export default NotFound;
