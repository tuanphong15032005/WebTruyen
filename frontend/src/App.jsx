import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import CreateChapter from './pages/Author/CreateChapter';
import CreateStory from './pages/Author/CreateStory';
import StoryDetail from './pages/Author/StoryDetail';
import StoryMetadata from './pages/Reader/StoryMetadata';
import StoryReviews from './pages/Reader/StoryReviews';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';

const App = () => {
  return (
    <BrowserRouter>
      <div className='app'>
        <Header />
        <main className='container'>
          <Routes>
            <Route path='/' element={<Navigate to='/author/create-story' />} />
            <Route path='/author/create-story' element={<CreateStory />} />
            <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
            <Route path='/author/stories/:storyId' element={<StoryDetail />} />
            <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
            <Route path='/stories/:storyId/reviews' element={<StoryReviews />} />
            <Route
              path='/author/stories/:storyId/volumes/:volumeId/create-chapter'
              element={<CreateChapter />}
            />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/verify-code' element={<VerifyCode />} />
            <Route path='*' element={<Navigate to='/author/create-story' />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
