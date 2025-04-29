using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.API.Mapping
{
    public class PaymentProfile : Profile
    {
        public PaymentProfile()
        {
            CreateMap<PaymentCreateDto, Payment>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.PaymentDate, opt => opt.Ignore())
                .ForMember(d => d.Status, opt => opt.Ignore());

            CreateMap<PaymentUpdateDto, Payment>()
                .ForMember(d => d.Status, opt => opt.MapFrom(src => (PaymentStatus)src.Status));

            CreateMap<Payment, PaymentReadDto>()
                .ForMember(d => d.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}
