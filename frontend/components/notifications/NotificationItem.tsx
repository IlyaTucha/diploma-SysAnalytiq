import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, MessageSquare, ArrowRight, Code, ChevronDown, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  isPinned?: boolean;
  onCollapse?: () => void;
}

export function NotificationItem({ notification, onRead, isPinned, onCollapse }: NotificationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState && !notification.isRead && notification.type !== 'rejected' && notification.type !== 'pending') {
      onRead();
    }
    if (!newState && isPinned) {
      onCollapse?.();
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-destructive" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-warning" />;
      default:
        return null;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'approved':
        return (
          <Badge className="bg-success text-success-foreground hover:bg-success/90">
            Принято
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            На доработке
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">
            На повторной проверке
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Только что';
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  return (
    <Card 
      onClick={toggleExpand}
      className={`transition-all duration-200 cursor-pointer border-l-4 overflow-hidden
        ${isPinned
          ? 'border-l-success bg-success/5 shadow-sm'
          : !notification.isRead 
            ? 'border-l-primary bg-primary/5 shadow-sm' 
            : 'border-l-border hover:bg-muted/20'}`}
    >
      <div className="p-5 flex gap-4 items-start">
        <div className="flex-shrink-0 pt-1">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                {getNotificationBadge(notification.type)}
              </div>
              <h3 className={`font-semibold text-lg leading-tight mb-1 ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.lessonTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {notification.moduleName}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(notification.reviewDate)}
                </span>
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                   <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
            </div>
          </div>

          {isExpanded && (
             <div className="pt-4 mt-2 border-t border-border animate-in fade-in zoom-in-95 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
                
                {(() => {
                  const hasComments = !!(notification.generalComment || notification.highlightedCode || notification.inlineComment || (notification.inlineComments && notification.inlineComments.length > 0));
                  
                  const reviewerBlock = (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground mr-1">Проверил:</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs bg-primary/10 text-primary ring-2 ring-background border border-border overflow-hidden`}>
                        {notification.reviewer.avatar ? (
                           <img src={notification.reviewer.avatar} alt={notification.reviewer.name} className="w-full h-full object-cover" />
                        ) : (
                           <span>{(notification.reviewer.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium text-foreground text-sm">{notification.reviewer.name}</span>
                    </div>
                  );

                  const actionButton = (
                    <Link to={notification.lessonPath}>
                      <Button
                        variant={notification.type === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        className={notification.type === 'rejected' ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white' : ''}
                      >
                        {notification.type === 'rejected' ? (
                          <>Исправить решение</>
                        ) : (
                          <>Посмотреть решение</>
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  );

                  if (!hasComments) {
                    return (
                      <div className="flex items-center justify-between">
                        {reviewerBlock}
                        {actionButton}
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="mb-4">{reviewerBlock}</div>

                      {notification.generalComment && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3 border border-border/50">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-muted-foreground block mb-0.5">Общий комментарий</span>
                              <p className="text-sm whitespace-pre-wrap">{notification.generalComment}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {notification.inlineComments && notification.inlineComments.length > 0 ? (
                        notification.inlineComments.map((comment, index) => (
                          <div key={index} className="bg-destructive/5 rounded-lg p-3 mb-4 border border-destructive/20">
                            {comment.highlightedText && (
                              <div className="mb-2">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Code className="w-3.5 h-3.5 text-destructive" />
                                    <span className="text-xs font-medium text-destructive">
                                      {comment.lineStart && comment.lineEnd ? (
                                        comment.lineStart === comment.lineEnd 
                                          ? `Строка ${comment.lineStart}`
                                          : `Строки ${comment.lineStart}-${comment.lineEnd}`
                                      ) : 'Выделенный код'}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <pre className="text-xs font-mono bg-background/80 block p-3 rounded-md border border-destructive/10 text-foreground overflow-x-auto whitespace-pre-wrap">
                                      {comment.highlightedText}
                                    </pre>
                                  </div>
                              </div>
                            )}
                            {comment.text && (
                              <div className="flex items-start gap-2 pt-1">
                                  <MessageSquare className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-destructive-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (notification.highlightedCode || notification.inlineComment) && (
                        <div className="bg-destructive/5 rounded-lg p-3 mb-4 border border-destructive/20">
                          {notification.highlightedCode && (
                            <div className="mb-2">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Code className="w-3.5 h-3.5 text-destructive" />
                                  <span className="text-xs font-medium text-destructive">
                                    {notification.startLine && notification.endLine ? (
                                      notification.startLine === notification.endLine 
                                        ? `Строка ${notification.startLine}`
                                        : `Строки ${notification.startLine}-${notification.endLine}`
                                    ) : 'Выделенный код'}
                                  </span>
                                </div>
                                <div className="relative">
                                  <pre className="text-xs font-mono bg-background/80 block p-3 rounded-md border border-destructive/10 text-foreground overflow-x-auto whitespace-pre-wrap">
                                    {notification.highlightedCode}
                                  </pre>
                                </div>
                            </div>
                          )}
                          {notification.inlineComment && (
                            <div className="flex items-start gap-2 pt-1">
                                <MessageSquare className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-destructive-foreground/90 whitespace-pre-wrap">{notification.inlineComment}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        {actionButton}
                      </div>
                    </>
                  );
                })()}
             </div>
          )}
        </div>
      </div>
    </Card>
  );
}
