package com.taskly.task;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DemoData {
    @Bean
    CommandLineRunner seedTasks(TaskRepository tasks) {
        return args -> {
            if (tasks.count() > 0) {
                return;
            }

            LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
            tasks.saveAll(List.of(
                    task("Revisar fluxo de cadastro", "Esther Howard", TaskPriority.MEDIUM, TaskStatus.DONE, TaskPeriod.DAILY, now.plusDays(1)),
                    task("Alinhar escopo da sprint", "Mike Chen", TaskPriority.URGENT, TaskStatus.IN_PROGRESS, TaskPeriod.DAILY, now.plusDays(2)),
                    task("Atualizar componentes do painel", "Max Stone", TaskPriority.MEDIUM, TaskStatus.DONE, TaskPeriod.DAILY, now.plusDays(3)),
                    task("Documentar API de tarefas", "Lucas Hayes", TaskPriority.LOW, TaskStatus.IN_PROGRESS, TaskPeriod.WEEKLY, now.plusDays(4)),
                    task("Preparar ambiente de homologação", "Daniel Reed", TaskPriority.MEDIUM, TaskStatus.NOT_STARTED, TaskPeriod.WEEKLY, now.plusDays(5)),
                    task("Mapear melhorias de usabilidade", "Mason Dean", TaskPriority.URGENT, TaskStatus.DONE, TaskPeriod.WEEKLY, now.plusDays(6)),
                    task("Organizar biblioteca de ícones", "Aaron Brooks", TaskPriority.LOW, TaskStatus.IN_PROGRESS, TaskPeriod.MONTHLY, now.plusDays(7)),
                    task("Revisar integração com o banco", "Liam Carter", TaskPriority.URGENT, TaskStatus.DONE, TaskPeriod.MONTHLY, now.plusDays(8))
            ));
        };
    }

    private Task task(String title, String assignee, TaskPriority priority, TaskStatus status,
                      TaskPeriod period, LocalDateTime dueDateTime) {
        Task task = new Task();
        task.setTitle(title);
        task.setAssignee(assignee);
        task.setPriority(priority);
        task.setStatus(status);
        task.setPeriod(period);
        task.setDueDateTime(dueDateTime);
        return task;
    }
}