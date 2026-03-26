<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string|null $title
 * @property string $content
 * @property int|null $project_id
 * @property array|null $tags
 * @property array|null $mentions
 * @property string|null $attachment_name
 * @property string|null $attachment_path
 * @property string|null $attachment_type
 * @property int|null $attachment_size
 * @property int $is_urgent
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ActivityAttachment> $attachments
 * @property-read int|null $attachments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ActivityComment> $comments
 * @property-read int|null $comments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ActivityLike> $likes
 * @property-read int|null $likes_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $mentionedUsers
 * @property-read int|null $mentioned_users_count
 * @property-read \App\Models\Project|null $project
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|Activity newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Activity newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Activity query()
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereAttachmentName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereAttachmentPath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereAttachmentSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereAttachmentType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereIsUrgent($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereMentions($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereTags($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Activity whereUserId($value)
 */
	class Activity extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $activity_id
 * @property string $name
 * @property string $path
 * @property string|null $type
 * @property int|null $size
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Activity $activity
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment query()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereActivityId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment wherePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityAttachment whereUpdatedAt($value)
 */
	class ActivityAttachment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $activity_id
 * @property int $user_id
 * @property string $comment
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Activity $activity
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment query()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment whereActivityId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment whereComment($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityComment whereUserId($value)
 */
	class ActivityComment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $activity_id
 * @property int $user_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Activity $activity
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike query()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike whereActivityId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLike whereUserId($value)
 */
	class ActivityLike extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property string $action
 * @property string|null $action_target
 * @property string $module
 * @property string $status
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog query()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereAction($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereActionTarget($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereMetadata($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereModule($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityLog whereUserId($value)
 */
	class ActivityLog extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $letter_number
 * @property \Illuminate\Support\Carbon $date
 * @property int $client_id
 * @property string $company_name
 * @property string $sector
 * @property string $purpose
 * @property string|null $position
 * @property int|null $template_id
 * @property string|null $content
 * @property string|null $generated_file_path
 * @property string|null $status
 * @property string|null $senior_manager_signature
 * @property string|null $general_manager_signature
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $approved_by
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property int|null $rejected_by
 * @property \Illuminate\Support\Carbon|null $rejected_at
 * @property string|null $rejection_reason
 * @property-read \App\Models\Client $client
 * @property-read \App\Models\User $creator
 * @property-read \App\Models\AudiensiTemplate|null $template
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter query()
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereApprovedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereClientId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereCompanyName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereCreatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereGeneralManagerSignature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereGeneratedFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereLetterNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter wherePosition($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter wherePurpose($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereRejectedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereRejectedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereRejectionReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereSector($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereSeniorManagerSignature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereTemplateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiLetter whereUpdatedAt($value)
 */
	class AudiensiLetter extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $version
 * @property string $format
 * @property string $sector
 * @property string $template_content
 * @property string $status
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $creator
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AudiensiLetter> $letters
 * @property-read int|null $letters_count
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate query()
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereCreatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereFormat($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereSector($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereTemplateContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AudiensiTemplate whereVersion($value)
 */
	class AudiensiTemplate extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property \Illuminate\Support\Carbon $date
 * @property int $duration_days
 * @property string|null $end_date
 * @property \Illuminate\Support\Carbon|null $start_time
 * @property \Illuminate\Support\Carbon|null $end_time
 * @property int $user_id
 * @property array|null $team_members
 * @property int|null $project_id
 * @property string $type
 * @property string $color
 * @property int $is_recurring
 * @property string|null $recurring_frequency
 * @property int $recurring_interval
 * @property string|null $recurring_end_type
 * @property string|null $recurring_end_date
 * @property int|null $recurring_count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Project|null $project
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent query()
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereColor($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereDurationDays($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereEndDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereEndTime($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereIsRecurring($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereRecurringCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereRecurringEndDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereRecurringEndType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereRecurringFrequency($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereRecurringInterval($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereStartTime($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereTeamMembers($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CalendarEvent whereUserId($value)
 */
	class CalendarEvent extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $code
 * @property string $company_name
 * @property string|null $logo
 * @property string $contact_person
 * @property string $contact_role
 * @property string $type
 * @property string $status
 * @property string $email
 * @property string $phone
 * @property string|null $industry
 * @property string|null $location
 * @property string|null $address
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AudiensiLetter> $audiensiLetters
 * @property-read int|null $audiensi_letters_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Project> $projects
 * @property-read int|null $projects_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Sph> $sph
 * @property-read int|null $sph_count
 * @method static \Illuminate\Database\Eloquent\Builder|Client newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Client newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Client query()
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereCompanyName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereContactPerson($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereContactRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereIndustry($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereLocation($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereLogo($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Client whereUpdatedAt($value)
 */
	class Client extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string $file_name
 * @property string $file_path
 * @property int|null $file_size
 * @property int $uploaded_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $uploader
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument query()
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereFileName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|EssentialDocument whereUploadedBy($value)
 */
	class EssentialDocument extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $title
 * @property string $client
 * @property string $priority
 * @property \Illuminate\Support\Carbon $date
 * @property int $assignee_id
 * @property string $status
 * @property array|null $tags
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $assignee
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\MarketingTaskAttachment> $attachments
 * @property-read int|null $attachments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\MarketingTaskComment> $comments
 * @property-read int|null $comments_count
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask query()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereAssigneeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereClient($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask wherePriority($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereTags($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTask whereUpdatedAt($value)
 */
	class MarketingTask extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $marketing_task_id
 * @property int|null $user_id
 * @property string|null $label
 * @property string $url
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\MarketingTask $task
 * @property-read \App\Models\User|null $user
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment query()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereLabel($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereMarketingTaskId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskAttachment whereUserId($value)
 */
	class MarketingTaskAttachment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $marketing_task_id
 * @property int $user_id
 * @property string $comment
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\MarketingTask $task
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment query()
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment whereComment($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment whereMarketingTaskId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|MarketingTaskComment whereUserId($value)
 */
	class MarketingTaskComment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property int|null $project_id
 * @property string $type
 * @property string $title
 * @property string $content
 * @property string|null $project_name
 * @property string|null $tag
 * @property bool $is_read
 * @property array|null $data
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Project|null $project
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|Notification newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Notification newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Notification query()
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereData($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereIsRead($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereProjectName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereTag($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Notification whereUserId($value)
 */
	class Notification extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $project_id
 * @property int $term_number
 * @property \Illuminate\Support\Carbon|null $term_date
 * @property string|null $percentage
 * @property string|null $amount
 * @property string|null $pic_name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Project $project
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm query()
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm wherePercentage($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm wherePicName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereTermDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereTermNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|PaymentTerm whereUpdatedAt($value)
 */
	class PaymentTerm extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $description
 * @property string $category
 * @property bool $is_enabled
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $users
 * @property-read int|null $users_count
 * @method static \Illuminate\Database\Eloquent\Builder|Permission newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Permission newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Permission query()
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereIsEnabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Permission whereUpdatedAt($value)
 */
	class Permission extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $is_tender
 * @property int $client_id
 * @property array|null $team_members
 * @property \Illuminate\Support\Carbon $start_date
 * @property \Illuminate\Support\Carbon $end_date
 * @property int $progress
 * @property string $status
 * @property int|null $pic_id
 * @property string|null $custom_pic_name
 * @property string|null $custom_team_notes
 * @property string|null $budget
 * @property string|null $actual_revenue
 * @property string|null $target_margin
 * @property string|null $compliance_requirements
 * @property string|null $quality_standard
 * @property string|null $target_compliance
 * @property string|null $description
 * @property string|null $location_address
 * @property string|null $latitude
 * @property string|null $longitude
 * @property array|null $locations
 * @property string|null $project_type
 * @property string|null $icon
 * @property string $approval_status
 * @property int|null $approved_by
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property string|null $rejection_reason
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $pic_marketing_id
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Activity> $activities
 * @property-read int|null $activities_count
 * @property-read \App\Models\User|null $approver
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ProjectAttachment> $attachments
 * @property-read int|null $attachments_count
 * @property-read \App\Models\Client $client
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ProjectComment> $comments
 * @property-read int|null $comments_count
 * @property-read \App\Models\User|null $marketingPic
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PaymentTerm> $paymentTerms
 * @property-read int|null $payment_terms_count
 * @property-read \App\Models\User|null $pic
 * @method static \Illuminate\Database\Eloquent\Builder|Project newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Project newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Project query()
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereActualRevenue($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereApprovalStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereApprovedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereBudget($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereClientId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereComplianceRequirements($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereCustomPicName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereCustomTeamNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereEndDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereIcon($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereIsTender($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereLatitude($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereLocationAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereLocations($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereLongitude($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project wherePicId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project wherePicMarketingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereProgress($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereProjectType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereQualityStandard($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereRejectionReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereStartDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereTargetCompliance($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereTargetMargin($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereTeamMembers($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Project whereUpdatedAt($value)
 */
	class Project extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $project_id
 * @property string $file_name
 * @property string $file_path
 * @property string $file_type
 * @property int $file_size
 * @property int $uploaded_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Project $project
 * @property-read \App\Models\User $uploader
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment query()
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereFileName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereFileType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectAttachment whereUploadedBy($value)
 */
	class ProjectAttachment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $project_id
 * @property int $user_id
 * @property string $comment
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Project $project
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment query()
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment whereComment($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ProjectComment whereUserId($value)
 */
	class ProjectComment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $sph_no
 * @property int $client_id
 * @property int|null $project_id
 * @property string $project_name
 * @property string $value
 * @property \Illuminate\Support\Carbon $date_created
 * @property string|null $status
 * @property string|null $senior_manager_signature
 * @property string|null $general_manager_signature
 * @property string|null $description
 * @property array|null $items
 * @property \Illuminate\Support\Carbon|null $validity_period
 * @property string|null $terms_conditions
 * @property string|null $generated_file_path
 * @property int $created_by
 * @property int|null $approved_by
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $rejected_by
 * @property \Illuminate\Support\Carbon|null $rejected_at
 * @property string|null $rejection_reason
 * @property-read \App\Models\User|null $approver
 * @property-read \App\Models\Client $client
 * @property-read \App\Models\User $creator
 * @property-read \App\Models\Project|null $project
 * @method static \Illuminate\Database\Eloquent\Builder|Sph newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Sph newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Sph query()
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereApprovedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereClientId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereCreatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereDateCreated($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereGeneralManagerSignature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereGeneratedFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereItems($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereProjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereProjectName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereRejectedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereRejectedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereRejectionReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereSeniorManagerSignature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereSphNo($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereTermsConditions($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereValidityPeriod($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Sph whereValue($value)
 */
	class Sph extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property mixed $password
 * @property string|null $role
 * @property string|null $division
 * @property string $status
 * @property string|null $avatar
 * @property string|null $signature
 * @property \Illuminate\Support\Carbon|null $last_activity_at
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property bool|null $is_online
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Activity> $activities
 * @property-read int|null $activities_count
 * @property-read mixed $role_name
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Notification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Project> $projects
 * @property-read int|null $projects_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Illuminate\Database\Eloquent\Builder|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User query()
 * @method static \Illuminate\Database\Eloquent\Builder|User whereAvatar($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereDivision($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereIsOnline($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereLastActivityAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereSignature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereUpdatedAt($value)
 */
	class User extends \Eloquent {}
}

