import { useState, useEffect } from 'react';
import axios from 'axios';
import './assets/reset.scss';
import './assets/style.scss';
import CloseIcon from './assets/xmark-solid-full.svg';

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const MODAL_TITLE = {
  create: '新增產品',
  edit: '修改產品',
  delete: '刪除產品',
};

const FORM_TEMPLATE = {
  title: '',
  category: '',
  unit: '',
  description: '',
  content: '',
  origin_price: '',
  price: '',
  is_enabled: false,
  imageUrl: '',
  imagesUrl: [],
};

const MAX_IMAGES = 5;

function App() {
  const [isAuth, setIsAuth] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [loginMessage, setLoginMessage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [productList, setProductList] = useState({});
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  // 列表相關
  const [formData, setFormData] = useState(FORM_TEMPLATE);

  const getProductList = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProductList(response.data.products);
    } catch (error) {
      console.error(error?.response?.data?.message);
    }
  };

  const handleFormChange = e => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  // login
  const handleInputChange = e => {
    const { id, value } = e.target;
    setLoginData({
      ...loginData,
      [id]: value,
    });
  };

  const loginSubmit = async () => {
    try {
      const response = await axios.post(`${API_BASE}/admin/signin`, loginData);
      const { message, token, expired } = response.data;
      setLoginMessage(message);
      document.cookie = `loginToken=${token}; expires=${new Date(expired)}`;
      axios.defaults.headers.common['Authorization'] = token;
      setIsAuth(true);
      getProductList();
    } catch (error) {
      setIsAuth(false);
      console.log(error?.response?.data);
    }
  };

  const checkStatus = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)loginToken\s*=\s*([^;]*).*$)|^.*$/, '$1');
      if (!token) {
        setIsAuth(false);
        return;
      }
      axios.defaults.headers.common['Authorization'] = token;
      await axios.post(`${API_BASE}/api/user/check`);
      setIsAuth(true);
      getProductList();
    } catch (error) {
      setIsAuth(false);
      console.log(error?.response?.data?.message);
    }
  };

  // API相關
    const handleCreate = async () => {
    try {
      const param = {
        data: {
          ...formData,
          origin_price: Number(formData.origin_price),
          price: Number(formData.price),
          is_enabled: formData.is_enabled ? 1 : 0,
          imagesUrl: formData.imagesUrl,
        },
      };
      const response = await axios.post(`${API_BASE}/api/${API_PATH}/admin/product`, param);
      console.log(response.data);
      closeModal();
      getProductList();
    } catch (error) {
      const message = error?.response?.data?.message.join(',');
      setSubmitMessage(message);
    }
  };

  const handleEdit = async () => {
     try {
         const id = formData.id;
      const param = {
        data: {
          ...formData,
          origin_price: Number(formData.origin_price),
          price: Number(formData.price),
          is_enabled: formData.is_enabled ? 1 : 0,
          imagesUrl: formData.imagesUrl,
        },
      };
      const response = await axios.put(`${API_BASE}/api/${API_PATH}/admin/product/${id}`, param);
      console.log(response.data);
      closeModal();
      getProductList();
    } catch (error) {
      const message = error?.response?.data?.message.join(',');
      setSubmitMessage(message);
    }
  };

  const handleDelete = async () => {
    try {
      const id = formData.id;
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      console.log(response.data);
      closeModal();
      getProductList();
    } catch (error) {
      const message = error?.response?.data?.message.join(',');
      setSubmitMessage(message);
    }
  };

  // modal 相關
  const openModal = (type, product = {}) => {
    setFormData({
      title: product.title || '',
      category: product.category || '',
      unit: product.unit || '',
      description: product.description || '',
      content: product.content || '',
      origin_price: product.origin_price || '',
      price: product.price || '',
      is_enabled: product.is_enabled || false,
      imageUrl: product.imageUrl || '',
      imagesUrl: product.imagesUrl || [],
      id: product.id || '',
    });
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSubmitMessage('');
    setIsModalOpen(false);
  };

  const addPic = () => {
    setFormData(prev => {
      if (prev.imagesUrl.length >= MAX_IMAGES) return prev;

      return {
        ...prev,
        imagesUrl: [...prev.imagesUrl, ''],
      };
    });
  };

  const deletePic = index => {
    setFormData(prev => {
      return {
        ...prev,
        imagesUrl: prev.imagesUrl.filter((_, i) => {
          return i !== index;
        }),
      };
    });
  };

  const handleImageChange = (index, value) => {
    setFormData(prev => {
      const newImages = [...prev.imagesUrl];
      newImages[index] = value;

      return {
        ...prev,
        imagesUrl: newImages,
      };
    });
  };

  const handleConfirm = () => {
    const actions = {
      create: handleCreate,
      edit: handleEdit,
      delete: handleDelete,
    };

    actions[modalType]?.();
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <>
      {isAuth ? (
        <div className="product-content">
          <button className="btn btn-primary product-button" type="button" onClick={() => openModal('create',{})}>
            新增產品
          </button>
          <table className="product-table">
            <thead>
              <tr>
                <th></th>
                <th>類別</th>
                <th>名稱</th>
                <th>原價</th>
                <th>售價</th>
                <th>是否啟用</th>
                <th>編輯</th>
              </tr>
            </thead>
            <tbody>
              {productList && productList.length > 0 ? (
                productList.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.category}</td>
                    <td>{item.title}</td>
                    <td className="align-right">{item.origin_price.toLocaleString()}</td>
                    <td className="align-right">{item.price.toLocaleString()}</td>
                    <td className={item.is_enabled ? 'activate' : 'unactivate'}>
                      {item.is_enabled ? '已啟用' : '未啟用'}
                    </td>
                    <td>
                      <button className="table-btn edit" type="button" onClick={() => openModal('edit', item)}>
                        編輯
                      </button>
                      <button className="table-btn delete" type="button" onClick={() => openModal('delete', item)}>
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">尚無產品資料</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <form className="form-container">
          <div className="form-input">
            <label htmlFor="username">Email</label>
            <input
              type="text"
              name="username"
              id="username"
              value={loginData.username}
              onChange={e => {
                handleInputChange(e);
              }}
              required
            />
          </div>
          <div className="form-input">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={loginData.password}
              onChange={e => {
                handleInputChange(e);
              }}
              required
            />
          </div>
          <button className="form-button" type="button" onClick={loginSubmit}>
            登入
          </button>
          <p className="form-hint">{loginMessage}</p>
        </form>
      )}
      {isModalOpen && (
        <div className="modal" style={modalType === 'delete' ? { width: '300px' } : { width: '900px' }}>
          <img className="modal-close" src={CloseIcon} alt="close" onClick={closeModal} />
          <h3 className="modal-title"> {MODAL_TITLE[modalType] ?? '新增產品'}</h3>
          <div className="modal-content" style={modalType === 'delete' ? { height: '100px' } : {}}>
            {modalType === 'delete' ? (
              <div>確認要刪除此產品？</div>
            ) : (
              <>
                <div>
                  <div className="modal-field">
                    <label htmlFor="title">標題</label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="description">描述</label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      cols="35"
                      value={formData.description}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="content">說明</label>
                    <textarea
                      id="content"
                      name="content"
                      rows="4"
                      cols="35"
                      value={formData.content}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="category">分類</label>
                    <input
                      type="text"
                      name="category"
                      id="category"
                      value={formData.category}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="unit">單位</label>
                    <input
                      type="text"
                      name="unit"
                      id="unit"
                      value={formData.unit}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="origin_price">原價</label>
                    <input
                      type="number"
                      name="origin_price"
                      id="origin_price"
                      value={formData.origin_price}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="price">售價</label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      value={formData.price}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <p>啟用</p>
                    <div>
                      <input
                        type="checkbox"
                        id="is_enabled"
                        name="is_enabled"
                        checked={formData.is_enabled}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            is_enabled: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="is_enabled">是</label>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="modal-field">
                    <label htmlFor="imageUrl">主圖網址</label>
                    <input
                      type="text"
                      name="imageUrl"
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={e => {
                        handleFormChange(e);
                      }}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <p>其他圖片</p>
                    <button type="button" disabled={formData.imagesUrl.length >= 5} onClick={addPic}>
                      增加
                    </button>
                    <p>(最多5張)</p>
                  </div>
                  {formData.imagesUrl &&
                    formData.imagesUrl.length > 0 &&
                    formData.imagesUrl.map((img, index) => {
                      return (
                        <div key={index} className="modal-field">
                          <label />
                          <input
                            type="text"
                            value={img}
                            onChange={e => {
                              handleImageChange(index, e.target.value);
                            }}
                          />
                          <button type="button" onClick={() => deletePic(index)}>
                            刪除
                          </button>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <p style={{ color: 'rgb(171, 15, 15)', fontSize: '14px' }}>
              {submitMessage !== '' ? `提示：${submitMessage}` : ''}
            </p>
            <div className="modal-btns">
              <button type="button" className="cancel" onClick={closeModal}>
                取消
              </button>
              <button type="button" className="confirm" onClick={handleConfirm}>
                {modalType === 'delete'? '確認' : '送出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
