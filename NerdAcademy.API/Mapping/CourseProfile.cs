using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.API.Mapping
{
    public class CourseProfile : Profile
    {
        public CourseProfile()
        {
            CreateMap<CourseCreateDto, Course>()
                // convert numeric Level/Status into enum
                .ForMember(d => d.Level, opt => opt.MapFrom(s => (CourseLevel)s.Level))
                .ForMember(d => d.Status, opt => opt.MapFrom(s => (CourseStatus)s.Status))
                // ignore nav props
                .ForMember(d => d.Tags, opt => opt.Ignore())
                .ForMember(d => d.Instructor, opt => opt.Ignore())
                .ForMember(d => d.Lessons, opt => opt.Ignore())
                .ForMember(d => d.Enrollments, opt => opt.Ignore());

            CreateMap<Course, CourseReadDto>()
                .ForMember(d => d.Level, opt => opt.MapFrom(s => s.Level.ToString()))
                .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()))
                .ForMember(d => d.TagIds, opt => opt.MapFrom(s => s.Tags.Select(t => t.Id).ToList()));


            // Update mapping for PATCH-style partial updates
            CreateMap<CourseUpdateDto, Course>()
                // Only map Level when provided
                .ForMember(dest => dest.Level, opt =>
                {
                    opt.Condition(src => src.Level.HasValue);
                    opt.MapFrom(src => (CourseLevel)src.Level!.Value);
                })
                // Only map Status when provided
                .ForMember(dest => dest.Status, opt =>
                {
                    opt.Condition(src => src.Status.HasValue);
                    opt.MapFrom(src => (CourseStatus)src.Status!.Value);
                })
                // For all other members, only map non-null values
                .ForAllMembers(opt =>
                    opt.Condition((src, dest, srcMember) => srcMember != null));


        }
    }
}
