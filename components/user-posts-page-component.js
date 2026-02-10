import { renderHeaderComponent } from "./header-component.js";
import { POSTS_PAGE } from "../routes.js";
import { posts, goToPage, user, handleLikeClick, pageData } from "../index.js";
import { escapeHtml } from "../helpers.js";

export function renderUserPostsPageComponent({ appEl, userId }) {
  
  
  // Используем переданный userId или ищем из постов
  let targetUserId = userId;
  
  // Если userId не передан, пытаемся найти из первого поста
  if (!targetUserId && posts.length > 0) {
    const userPost = posts.find(post => post.user && post.user.id);
    if (userPost) {
      targetUserId = userPost.user.id;
    }
  }
  
  // Фильтруем посты только этого пользователя
  const userPosts = targetUserId ? 
    posts.filter(post => post.user && post.user.id === targetUserId) : 
    [];
  
  
  
  const currentUser = userPosts.length > 0 ? userPosts[0].user : null;

  // Функция для форматирования даты
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'только что';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${getNoun(minutes, 'минуту', 'минуты', 'минут')} назад`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${getNoun(hours, 'час', 'часа', 'часов')} назад`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${getNoun(days, 'день', 'дня', 'дней')} назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  }

  function getNoun(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
      return five;
    }
    n %= 10;
    if (n === 1) {
      return one;
    }
    if (n >= 2 && n <= 4) {
      return two;
    }
    return five;
  }

  // Функция для безопасного получения URL изображения
  function getSafeImageUrl(url, type) {
  const fallbacks = {
    'avatar': window.getFallbackImage ? window.getFallbackImage('avatar') : './assets/images/no-avatar.png',
    'post': window.getFallbackImage ? window.getFallbackImage('post') : './assets/images/no-image.png'
  };
  
  const fallback = type === 'avatar' ? fallbacks.avatar : fallbacks.post;
  
  if (!url || url.includes('image.png') || url.includes('undefined') || url === '') {
    return fallback;
  }
  
  // Проверяем, не является ли URL ошибкой
  if (url.startsWith('https://image.png') || url.includes('avatarko.ru')) {
    return fallback;
  }
  
  return url;
}

  // Генерируем HTML для каждого поста пользователя
  const postsHtml = userPosts.map((post) => {
    // Проверяем наличие пользователя
    const postUser = post.user || { 
      id: 'unknown', 
      name: 'Неизвестный', 
      imageUrl: '' 
    };
    
    // Безопасное получение количества лайков
    const likesCount = post.likes ? post.likes.length : 0;
    
    // Внимание: в ваших данных лайки имеют структуру {id: '...', name: '...'}
   const isLiked = user && post.likes ? 
  post.likes.some(like => {
    // Проверяем оба варианта: like.id и like._id
    const likeId = like.id || like._id;
    return likeId === user._id;
  }) : false;
    // Форматируем дату
    const postDate = formatDate(post.createdAt);
    
    // Безопасные URL для изображений
    const userImageUrl = getSafeImageUrl(postUser.imageUrl, 'avatar');
    const postImageUrl = getSafeImageUrl(post.imageUrl, 'post');
    
    return `
      <li class="post">
        <div class="post-header" data-user-id="${postUser.id}">
            <img src="${userImageUrl}" 
                 class="post-header__user-image"
                 onerror="this.onerror=null; this.src='./assets/images/no-avatar.png';">
            <p class="post-header__user-name">${postUser.name}</p>
        </div>
        <div class="post-image-container">
          <img class="post-image" 
               src="${postImageUrl}"
               onerror="this.onerror=null; this.src='./assets/images/no-image.png';">
        </div>
        <div class="post-likes">
          <button data-post-id="${post.id}" class="like-button">
            <img src="${isLiked ? './assets/images/like-active.svg' : './assets/images/like-not-active.svg'}">
          </button>
          <p class="post-likes-text">
            Нравится: <strong>${likesCount}</strong>
          </p>
        </div>
        <p class="post-text">
          
          ${escapeHtml(post.description || '')}
        </p>
        <p class="post-date">
          ${postDate}
        </p>
      </li>
    `;
  }).join('');

  const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      ${currentUser ? `
        <div class="posts-user-header">
          <img src="${getSafeImageUrl(currentUser.imageUrl, './assets/images/no-avatar.png')}" 
               class="posts-user-header__user-image"
               onerror="this.onerror=null; this.src='./assets/images/no-avatar.png';">
          <p class="posts-user-header__user-name">${currentUser.name}</p>
        </div>
      ` : ''}
      <ul class="posts">
        ${postsHtml ? postsHtml : '<p class="no-posts">У этого пользователя пока нет постов</p>'}
      </ul>
    </div>
  `;

  appEl.innerHTML = appHtml;

  // Рендерим шапку
  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  // Обработка кликов на заголовок поста для перехода на страницу пользователя
  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      const userId = userEl.dataset.userId;
      if (userId && userId !== 'unknown') {
        goToPage(POSTS_PAGE, { // Исправлено: возвращаемся на главную страницу
          userId: userId,
        });
      }
    });
  }

  // Обработка кликов на лайки
  for (let likeButton of document.querySelectorAll(".like-button")) {
    likeButton.addEventListener("click", () => {
      const postId = likeButton.dataset.postId;
      handleLikeClick(postId);
    });
  }
}