const labels = {
  period: { DAILY: 'Diária', WEEKLY: 'Semanal', MONTHLY: 'Mensal' },
  priority: { LOW: 'Baixa', MEDIUM: 'Média', URGENT: 'Urgente' },
  status: { NOT_STARTED: 'Não iniciada', IN_PROGRESS: 'Em andamento', DONE: 'Concluída' }
};

const state = { tasks: [], period: 'DAILY', query: '', status: '' };
const rows = document.querySelector('#task-rows');
const dialog = document.querySelector('#task-dialog');
const form = document.querySelector('#task-form');
const toast = document.querySelector('#toast');
let toastTimer;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?';
}

function localDateValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value) {
  const date = new Date(value);
  return `${new Intl.DateTimeFormat('pt-BR').format(date)} · ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)}`;
}

function isOverdue(task) {
  return task.status !== 'DONE' && new Date(task.dueDateTime) < new Date();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erro ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

async function loadTasks() {
  try {
    state.tasks = await request('/api/tasks');
    render();
  } catch (error) {
    rows.innerHTML = '<tr><td class="empty-state" colspan="6">Não foi possível carregar as tarefas. Confira se o servidor está conectado.</td></tr>';
    showToast('Falha ao carregar tarefas.');
    console.error(error);
  }
}

function renderStats() {
  const complete = state.tasks.filter(task => task.status === 'DONE').length;
  const overdue = state.tasks.filter(isOverdue).length;
  document.querySelector('#total-stat').textContent = state.tasks.length;
  document.querySelector('#done-stat').textContent = complete;
  document.querySelector('#overdue-stat').textContent = overdue;
  document.querySelector('#completion-rate').textContent = `${state.tasks.length ? Math.round(complete / state.tasks.length * 100) : 0}%`;
  document.querySelector('#overdue-note').textContent = overdue ? 'Precisam de atenção' : 'Tudo em dia por aqui';
  document.querySelector('#nav-count').textContent = state.tasks.length;
  for (const period of ['DAILY', 'WEEKLY', 'MONTHLY']) {
    const count = state.tasks.filter(task => task.period === period).length;
    document.querySelector(`#${period.toLowerCase()}-count`).textContent = count;
  }
}

function render() {
  renderStats();
  const visible = state.tasks.filter(task => task.period === state.period)
    .filter(task => !state.status || task.status === state.status)
    .filter(task => !state.query || `${task.title} ${task.assignee || ''}`.toLocaleLowerCase('pt-BR').includes(state.query.toLocaleLowerCase('pt-BR')))
    .sort((first, second) => new Date(first.dueDateTime) - new Date(second.dueDateTime));

  document.querySelector('#results-count').textContent = `${visible.length} ${visible.length === 1 ? 'tarefa' : 'tarefas'}`;
  if (!visible.length) {
    rows.innerHTML = '<tr><td class="empty-state" colspan="6">Nenhuma tarefa neste período. Que tal criar a primeira?</td></tr>';
    return;
  }

  rows.innerHTML = visible.map((task, index) => `
    <tr style="animation-delay:${Math.min(index * 25, 200)}ms">
      <td><span class="task-title">${escapeHtml(task.title)}</span>${task.description ? `<span class="task-description">${escapeHtml(task.description)}</span>` : ''}</td>
      <td><span class="person-cell"><span class="avatar person-avatar" style="background-color:${avatarColor(task.assignee)}">${escapeHtml(initials(task.assignee))}</span><span class="person-name">${escapeHtml(task.assignee || 'Sem responsável')}</span></span></td>
      <td><span class="priority-pill priority-${task.priority}">${labels.priority[task.priority]}</span></td>
      <td><span class="date-cell ${isOverdue(task) ? 'overdue' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>${formatDate(task.dueDateTime)}</span></td>
      <td><span class="status-pill status-${task.status}"><select data-status-id="${task.id}" aria-label="Status de ${escapeHtml(task.title)}">${Object.entries(labels.status).map(([value, label]) => `<option value="${value}" ${task.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></span></td>
      <td><span class="row-actions"><button class="row-action edit" data-edit-id="${task.id}" type="button" aria-label="Editar ${escapeHtml(task.title)}" title="Editar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 4 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z"/></svg></button><button class="row-action delete" data-delete-id="${task.id}" type="button" aria-label="Excluir ${escapeHtml(task.title)}" title="Excluir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg></button></span></td>
    </tr>`).join('');
}

function avatarColor(name = '') {
  const colors = ['#e7d9c8', '#d8e4d7', '#e9d9dc', '#d8e2ea', '#e8e5cc', '#d8e8e3'];
  const score = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return colors[score % colors.length];
}

function openDialog(task) {
  form.reset();
  document.querySelector('#form-error').textContent = '';
  document.querySelector('#dialog-title').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
  document.querySelector('#task-id').value = task?.id || '';
  document.querySelector('#task-title').value = task?.title || '';
  document.querySelector('#task-description').value = task?.description || '';
  document.querySelector('#task-assignee').value = task?.assignee || '';
  document.querySelector('#task-period').value = task?.period || state.period;
  document.querySelector('#task-priority').value = task?.priority || 'MEDIUM';
  document.querySelector('#task-status').value = task?.status || 'NOT_STARTED';
  document.querySelector('#task-due').value = task ? localDateValue(new Date(task.dueDateTime)) : localDateValue(new Date(Date.now() + 86400000));
  dialog.showModal();
  document.querySelector('#task-title').focus();
}

document.querySelector('#new-task-button').addEventListener('click', () => openDialog());
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

document.querySelectorAll('.period-tab').forEach(tab => tab.addEventListener('click', () => {
  state.period = tab.dataset.period;
  document.querySelectorAll('.period-tab').forEach(item => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  render();
}));

document.querySelector('#search-input').addEventListener('input', event => {
  state.query = event.target.value.trim();
  render();
});
document.querySelector('#status-filter').addEventListener('change', event => {
  state.status = event.target.value;
  render();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const id = document.querySelector('#task-id').value;
  const task = {
    title: document.querySelector('#task-title').value.trim(),
    description: document.querySelector('#task-description').value.trim(),
    assignee: document.querySelector('#task-assignee').value.trim(),
    period: document.querySelector('#task-period').value,
    priority: document.querySelector('#task-priority').value,
    status: document.querySelector('#task-status').value,
    dueDateTime: document.querySelector('#task-due').value
  };
  try {
    await request(id ? `/api/tasks/${id}` : '/api/tasks', { method: id ? 'PUT' : 'POST', body: JSON.stringify(task) });
    dialog.close();
    await loadTasks();
    showToast(id ? 'Tarefa atualizada.' : 'Tarefa criada.');
  } catch (error) {
    document.querySelector('#form-error').textContent = 'Não foi possível salvar. Verifique os campos e tente novamente.';
    console.error(error);
  }
});

rows.addEventListener('click', async event => {
  const editButton = event.target.closest('[data-edit-id]');
  const deleteButton = event.target.closest('[data-delete-id]');
  if (editButton) {
    const task = state.tasks.find(item => item.id === Number(editButton.dataset.editId));
    if (task) openDialog(task);
  }
  if (deleteButton) {
    const task = state.tasks.find(item => item.id === Number(deleteButton.dataset.deleteId));
    if (!task || !window.confirm(`Excluir "${task.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await request(`/api/tasks/${task.id}`, { method: 'DELETE' });
      await loadTasks();
      showToast('Tarefa excluída.');
    } catch (error) {
      showToast('Não foi possível excluir a tarefa.');
      console.error(error);
    }
  }
});

rows.addEventListener('change', async event => {
  const select = event.target.closest('[data-status-id]');
  if (!select) return;
  const task = state.tasks.find(item => item.id === Number(select.dataset.statusId));
  if (!task) return;
  try {
    await request(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, status: select.value })
    });
    await loadTasks();
    showToast('Status atualizado.');
  } catch (error) {
    showToast('Não foi possível atualizar o status.');
    console.error(error);
  }
});

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
loadTasks();