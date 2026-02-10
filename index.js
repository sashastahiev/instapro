import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import { getPosts, addPost, getUserPosts, likePost, dislikePost } from "./api.js";
import { renderUserPostsPageComponent } from "./components/user-posts-page-component.js";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./helpers.js";

export let user = getUserFromLocalStorage();
export let page = null;
export let posts = [];
export let pageData = null;

const getToken = () => {
  const token = user ? `Bearer ${user.token}` : undefined;
  return token;
};

export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
};

/**
 * Включает страницу приложения
 */
export const goToPage = (newPage, data) => {
  pageData = data; // Сохраняем данные страницы
  
  if (
    [
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    if (newPage === ADD_POSTS_PAGE) {
      /* Если пользователь не авторизован, то отправляем его на страницу авторизации перед добавлением поста */
      page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
      return renderApp();
    }

    if (newPage === POSTS_PAGE) {
      page = LOADING_PAGE;
      renderApp();

      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          goToPage(POSTS_PAGE);
        });
    }

    if (newPage === USER_POSTS_PAGE) {
  page = LOADING_PAGE;
  renderApp();

  return getUserPosts({ token: getToken(), userId: data.userId })
    .then((newPosts) => {
      page = USER_POSTS_PAGE;
      posts = newPosts;
      renderApp();
    })
    .catch((error) => {
      console.error(error);
      goToPage(POSTS_PAGE);
    });
}

    page = newPage;
    renderApp();

    return;
  }

  throw new Error("страницы не существует");
};

const renderApp = () => {
  const appEl = document.getElementById("app");
  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(user);
        goToPage(POSTS_PAGE);
      },
      user,
      goToPage,
    });
  }

  if (page === ADD_POSTS_PAGE) {
  return renderAddPostPageComponent({
    appEl,
    onAddPostClick({ description, imageUrl }) {
      // Добавляем пост в API
      addPost({
        token: getToken(),
        description,
        imageUrl,
      })
        .then(() => {
          // После успешного добавления переходим на страницу постов
          goToPage(POSTS_PAGE);
        })
        .catch((error) => {
          console.error("Ошибка при добавлении поста:", error);
          alert(error.message);
        });
    },
  });
}

  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
    });
  }

  if (page === USER_POSTS_PAGE) {
  return renderUserPostsPageComponent({
    appEl,
    userId: pageData ? pageData.userId : undefined,
  });
}
};

goToPage(POSTS_PAGE);

// функции для работы с лайками:
export const handleLikeClick = (postId) => {

  const likeButton = event.target.closest('.like-button');
if (likeButton) {
  likeButton.classList.add('loading');
}
  
  if (!user) {
    alert("Чтобы ставить лайки, нужно авторизоваться");
    goToPage(AUTH_PAGE);
    return;
  }

  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) {
    console.error("Пост не найден");
    return;
  }

  const post = posts[postIndex];
  
  // ВАЖНО: проверьте структуру like в ваших данных!
  // В ваших данных лайк имеет вид: {id: '6421860c32e0301869fb3301', name: 'Админ'}
  // Значит поле userId отсутствует, используем like.id
 
  

  const isLiked = post.likes && post.likes.some(like => like.id === user._id);
  
 

  const apiCall = isLiked ? dislikePost : likePost;
  
  apiCall({
    token: getToken(),
    postId,
  })
    .then((response) => {
      
      
      // API возвращает объект { post: {...} }, извлекаем пост
      const updatedPostData = response.post;
      
      // Сохраняем данные о пользователе из старого поста
      if (!updatedPostData.user && post.user) {
        updatedPostData.user = post.user;
      }
      
      // Обновляем пост в массиве posts
      posts[postIndex] = updatedPostData;
      
      // Перерисовываем текущую страницу
      const appEl = document.getElementById("app");
      if (page === POSTS_PAGE) {
        renderPostsPageComponent({ appEl });
      } else if (page === USER_POSTS_PAGE) {
        renderUserPostsPageComponent({
          appEl,
          userId: pageData ? pageData.userId : undefined,
        });
      }
      
    })
    .finally(() => {
  if (likeButton) {
    likeButton.classList.remove('loading');
  }
})
    .catch((error) => {
      console.error("Ошибка при обработке лайка:", error);
      alert(`Не удалось поставить лайк: ${error.message}`);
    })
    .finally(() => {
  if (likeButton) {
    likeButton.classList.remove('loading');
  }
});;
};